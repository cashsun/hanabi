// temp solution https://gist.github.com/perfectbase/d134c174e9e6c479727c160f6997f0e6
import { MCPClientError, type JSONRPCMessage, type MCPTransport } from "ai";

export interface StreamableHTTPTransportConfig {
  url: string;
  headers?: HeadersInit;
  fetch?: typeof fetch; // Allow providing custom fetch implementation
}

/**
 * This is a temporary transport until the ai-sdk supports StreamableHTTP.
 */
export class StreamableHTTPTransport implements MCPTransport {
  private url: string;
  private fetchImplementation: typeof fetch;
  private eventSource: EventSource | null = null;
  private sessionId: string | null = null;
  private isClosed = true;
  private abortController: AbortController | null = null;
  private headersOverride: HeadersInit;

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  constructor(config: StreamableHTTPTransportConfig) {
    this.url = config.url;
    this.fetchImplementation = config.fetch ?? fetch;
    this.headersOverride = config.headers ?? {};
  }

  async start(): Promise<void> {
    if (!this.isClosed) {
      throw new MCPClientError({ message: "Transport already started" });
    }
    this.isClosed = false;
    this.abortController = new AbortController();

    // Streamable HTTP doesn't require an initial GET like SSE.
    // The initialization happens with the first POST request sent via send()
    // (typically the 'initialize' request from the MCPClient).
    // The server will then respond, potentially including the session ID.
    // The client *may* make a GET request later if it needs to receive server-initiated messages.
    // For now, we assume the primary flow is client request -> server response via POST.
    // A dedicated GET stream will be established if needed.
    console.log(
      "StreamableHTTPTransport started. Ready to send initial request.",
    );
  }

  private async establishReceiveStream(): Promise<void> {
    if (this.eventSource || this.isClosed) {
      console.log(
        `[GET Stream] Skipping establish: eventSource=${!!this.eventSource}, isClosed=${this.isClosed}`,
      );
      return; // Already established or closed
    }
    console.log("[GET Stream] Attempting to establish...");

    const headers: HeadersInit = {
      ...this.headersOverride,
      Accept: "text/event-stream",
    };
    if (this.sessionId) {
      (headers as any)["Mcp-Session-Id"] = this.sessionId;
    }

    try {
      // Use fetch for SSE - EventSource has limitations (e.g., custom headers on initial req)
      const response = await this.fetchImplementation(this.url, {
        method: "GET",
        headers,
        signal: this.abortController?.signal,
        cache: "no-store",
      });

      console.log(`[GET Stream] Fetch response status: ${response.status}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new MCPClientError({
          message: `Failed to establish SSE stream: ${response.status} ${response.statusText} - ${errorText}`,
        });
      }
      if (!response.body) {
        throw new MCPClientError({
          message: "SSE stream response has no body",
        });
      }

      console.log("[GET Stream] Established successfully.");
      // Process the stream
      void this.processSSEStream(response.body, "GET");
    } catch (error) {
      console.error("[GET Stream] Error establishing stream:", error);
      this.handleError(
        error instanceof Error ? error : new Error(String(error)),
      );
      await this.close(); // Close transport if stream fails
    }
  }

  private async processSSEStream(
    stream: ReadableStream<Uint8Array>,
    streamType: "POST" | "GET",
  ): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    console.log(`[Process ${streamType} Stream] Starting reader loop...`);

    try {
      while (!this.isClosed) {
        const { done, value } = await reader.read();
        if (done) {
          console.log(
            `[Process ${streamType} Stream] Stream finished (done = true).`,
          );
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.trim() === "") {
            // Empty line signifies end of an event
            if (buffer.startsWith("data:")) {
              // Check if we actually have data
              const data = buffer.substring(5).trim();
              try {
                const message = JSON.parse(data) as JSONRPCMessage;
                console.log(
                  `[Process ${streamType} Stream] Received message via SSE:`,
                  message,
                );
                this.onmessage?.(message);
              } catch (parseError) {
                this.handleError(
                  new MCPClientError({
                    message: `Failed to parse SSE message data: ${data}`,
                    cause: parseError,
                  }),
                );
              }
            }
            // Reset for next event
            buffer = "";
            continue; // Move to next line
          }

          if (line.startsWith("event:")) {
            const eventType = line.substring(6).trim();
            if (eventType !== "message") {
              console.warn(`Received unknown SSE event type: ${eventType}`);
              // If we get an unexpected event, we might need to reset buffer
              buffer = "";
            }
          } else if (line.startsWith("data:")) {
            // Append data line to buffer (strip 'data:' prefix)
            // If buffer already has data, add newline back (since split removed it)
            buffer += (buffer ? "\n" : "") + line.substring(5).trim();
          } else {
            // Ignore comments and other lines
          }
        }
        // After processing all complete lines, the remaining buffer (incomplete line)
        // is carried over to the next read() iteration.
      }
    } catch (error) {
      if (!this.isClosed) {
        // Avoid erroring if closed intentionally
        console.error(
          `[Process ${streamType} Stream] Error reading from stream:`,
          error,
        );
        this.handleError(
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    } finally {
      // Do not close the transport here just because the stream ended.
      // Closing should be handled by explicit calls to this.close() or errors during reading.
      // if (!this.isClosed) {
      //  await this.close(); // Ensure cleanup if stream ends unexpectedly
      // }
      reader.releaseLock();
      console.log(`[Process ${streamType} Stream] Reader released.`);
    }
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (this.isClosed) {
      throw new MCPClientError({ message: "Transport is closed" });
    }

    const headers: HeadersInit = {
      ...this.headersOverride,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream", // Client must accept both
    };

    if (this.sessionId) {
      (headers as any)["Mcp-Session-Id"] = this.sessionId;
    }

    console.log("Sending POST message:", message);
    try {
      const response = await this.fetchImplementation(this.url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(message),
        signal: this.abortController?.signal,
      });

      // Store session ID from the first successful response (usually initialize)
      if (!this.sessionId) {
        const serverSessionId = response.headers.get("Mcp-Session-Id");
        if (serverSessionId) {
          this.sessionId = serverSessionId;
          console.log(`Session ID received: ${this.sessionId}`);
          // Now that we have a session ID, establish the GET stream for server messages
          await this.establishReceiveStream();
        } else if ("method" in message && message.method === "initialize") {
          // Initialize should return a session ID if server is stateful
          console.warn(
            "Initialize response did not contain Mcp-Session-Id header.",
          );
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        const errorResponse = this.tryParseErrorResponse(errorText);
        throw new MCPClientError({
          message: `Server responded with error: ${response.status} ${response.statusText}`,
          cause: errorResponse ?? errorText, // Include parsed error or raw text
        });
      }

      const contentType = response.headers.get("content-type");

      // Handle different response types based on Content-Type
      // Prioritize JSON, as it's the expected response for initialize in stateless mode.
      if (contentType?.includes("application/json")) {
        const responseBody = (await response.json()) as unknown; // Assign to unknown first
        console.log("Received JSON response:", responseBody);
        // Process single or batch JSON responses
        const messages = (
          Array.isArray(responseBody) ? responseBody : [responseBody]
        ) as unknown[];

        for (const msg of messages) {
          // Basic validation, MCPClient will do full parsing
          if (typeof msg === "object" && msg !== null && "jsonrpc" in msg) {
            this.onmessage?.(msg as JSONRPCMessage);
          } else {
            this.handleError(
              new MCPClientError({
                message: `Received invalid JSON message structure: ${JSON.stringify(msg)}`,
              }),
            );
          }
        }
      } else if (contentType?.includes("text/event-stream")) {
        // WORKAROUND: Server is incorrectly sending SSE for POST response even in stateless mode.
        // Assume the *first* data message contains the complete JSON response.
        console.log(
          "[WORKAROUND] Received unexpected SSE stream in POST response. Attempting to extract first message as JSON.",
        );
        if (!response.body) {
          throw new MCPClientError({
            message: "[WORKAROUND] SSE stream response has no body",
          });
        }

        // Extract only the first message
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        try {
          const { done, value } = await reader.read();
          if (!done && value) {
            buffer += decoder.decode(value, { stream: false }); // Decode the single chunk
            const lines = buffer.split("\n");
            for (const line of lines) {
              if (line.startsWith("data:")) {
                const data = line.substring(5).trim();
                try {
                  const jsonRpcMessage = JSON.parse(data) as JSONRPCMessage;
                  console.log(
                    "[WORKAROUND] Extracted JSON message from first SSE data:",
                    jsonRpcMessage,
                  );
                  this.onmessage?.(jsonRpcMessage);
                  break; // Got the first message, stop processing lines from this chunk
                } catch (parseError) {
                  this.handleError(
                    new MCPClientError({
                      message: `[WORKAROUND] Failed to parse first SSE message data: ${data}`,
                      cause: parseError,
                    }),
                  );
                  break;
                }
              }
            }
          }
        } catch (readError) {
          this.handleError(
            new MCPClientError({
              message: `[WORKAROUND] Error reading first chunk of SSE response`,
              cause: readError,
            }),
          );
        } finally {
          // Ensure the reader is released even if we only read one chunk
          reader.releaseLock();
          console.log(
            "[WORKAROUND] Released reader after extracting first SSE message.",
          );
        }
      } else if (response.status === 202) {
        // Accepted - Notification likely processed, no content expected.
        console.log("Received 202 Accepted.");
      } else {
        // Handle other potential valid responses or unexpected content types
        const responseText = await response.text();
        console.warn(
          `Received unexpected Content-Type: ${contentType} or status ${response.status}. Body: ${responseText}`,
        );
        // If it looks like JSON-RPC, try parsing it anyway.
        const potentialMessage = this.tryParseJsonRpc(responseText);
        if (potentialMessage) {
          this.onmessage?.(potentialMessage);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      this.handleError(
        error instanceof Error ? error : new Error(String(error)),
      );
      // Optional: Decide if send errors should close the transport
      // await this.close();
    }
  }

  async close(): Promise<void> {
    if (this.isClosed) {
      return;
    }
    this.isClosed = true;
    console.log("Closing StreamableHTTPTransport...");

    this.abortController?.abort(); // Abort ongoing fetch requests/streams
    this.eventSource?.close(); // Close explicit EventSource if used (though fetch stream is preferred)
    this.eventSource = null;

    // Send DELETE request to terminate session on the server if we have a session ID
    if (this.sessionId) {
      console.log(`Sending DELETE to terminate session: ${this.sessionId}`);
      try {
        const headers: HeadersInit = { "Mcp-Session-Id": this.sessionId };
        const response = await this.fetchImplementation(this.url, {
          method: "DELETE",
          headers: headers,
        });
        if (!response.ok) {
          console.warn(
            `Failed to terminate session on server: ${response.status} ${response.statusText}`,
          );
        } else {
          console.log("Session terminated successfully on server.");
        }
      } catch (error) {
        console.warn("Error sending DELETE request:", error);
        // Don't propagate error during close, just warn
      }
    }

    this.sessionId = null;
    this.onclose?.();
    console.log("StreamableHTTPTransport closed.");
  }

  private handleError(error: Error): void {
    if (
      this.isClosed &&
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      // Ignore abort errors during close
      return;
    }
    console.error("StreamableHTTPTransport Error:", error);
    this.onerror?.(error);
  }

  // Helper to attempt parsing error responses
  private tryParseErrorResponse(text: string): object | null {
    try {
      const json = JSON.parse(text) as unknown;
      if (
        typeof json === "object" &&
        json !== null &&
        "error" in json &&
        typeof json.error === "object"
      ) {
        return json.error;
      }
    } catch {
      /* ignore parse error */
    }
    return null;
  }

  private tryParseJsonRpc(text: string): JSONRPCMessage | null {
    try {
      const json = JSON.parse(text) as unknown;
      if (
        typeof json === "object" &&
        json !== null &&
        "jsonrpc" in json &&
        json.jsonrpc === "2.0"
      ) {
        // Basic check, client will validate schema fully
        return json as JSONRPCMessage;
      }
    } catch {
      /* ignore parse error */
    }
    return null;
  }
}