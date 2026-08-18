export const GameState = {
    notes: { music_m: false, music_p: false, music_c: false },
    visited: { bedroom: false, kitchen: false, musicRoom: false },
    introDone: false,  
    startTime: null,

    reset() {
        this.notes = { music_m: false, music_p: false, music_c: false }
        this.visited = { bedroom: false, kitchen: false, musicRoom: false }
        this.introDone = false
        this.startTime = Date.now()
    },

    noteCount() {
        return Object.values(this.notes).filter(Boolean).length
    },

    allNotesCollected() {
        return this.notes.music_m && this.notes.music_p && this.notes.music_c
    },

    minutesPlayed() {
        if (!this.startTime) return 0
        return Math.floor((Date.now() - this.startTime) / 60000)
    }
}

if (!GameState.startTime) GameState.reset()
