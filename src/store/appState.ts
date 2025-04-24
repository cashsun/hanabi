import { create } from 'zustand'
import { hasConfig } from '../components/config/util.js'

interface AppState {
    ready: boolean
}

export const useAppStore = create<AppState>((set) => ({
    ready: hasConfig(), 
}))

export const setAppReady = (ready: boolean) => {
    useAppStore.setState({ ready: true })
}