import Phaser from 'phaser'
import { GameState } from './GameState.js'

export default class EndingScene extends Phaser.Scene {
    constructor() { super('EndingScene') }

    preload() {
        this.load.image('end',      'end.png')
        this.load.image('poppy_h',  'spirits/poppy_h.png')
        this.load.image('poppy_p',  'spirits/poppy_p.png')
        this.load.image('poppy_a',  'spirits/poppy_a.png')
        this.load.image('citrus_h', 'spirits/citrus_h.png')
        this.load.image('citrus_e', 'spirits/citrus_e.png')
        this.load.image('melody_h', 'spirits/melody_h.png')
        this.load.image('melody_e', 'spirits/melody_e.png')
        this.load.image('music_m',  'random/music_m.png')
        this.load.image('music_p',  'random/music_p.png')
        this.load.image('music_c',  'random/music.png')
        ;['lia_stand','lia_an','lia_e','lia_sur','lia_s','lia_c','lia_h'].forEach(k =>
            this.load.image(k, 'sprites/'+k+'.png'))
        this.load.audio('sparkle',  'music/sparkle.mp3')
        this.load.audio('ending',   'music/ending.mp3')
        this.load.audio('witch',    'music/witch.mp3')
    }

    create() {
        const W = this.scale.width, H = this.scale.height
        this.W = W; this.H = H
        this._dlgActive = false
        this._dlgQueue  = []
        this._dlgIndex  = 0
        this._dlgOnDone = null

        this.add.image(W/2, H/2, 'end').setDisplaySize(W, H).setDepth(0)

        const ov = this.add.graphics().setDepth(1)
        ov.fillStyle(0x000000, 0.45).fillRect(0, 0, W, H)

        this._buildDialogueBox()
        this.cameras.main.fadeIn(600, 0, 0, 0)

        this.sound.play('ending', { loop: true, volume: 0.4 })

        this.time.delayedCall(800, () => this._startEndingSequence())
    }

    _startEndingSequence() {
        const W = this.W, H = this.H

        const spirits = [
            { key: 'poppy_h',  x: W*0.3,  y: H*0.35 },
            { key: 'citrus_h', x: W*0.5,  y: H*0.25 },
            { key: 'melody_h', x: W*0.7,  y: H*0.35 },
        ]

        this._spiritImgs = spirits.map(s => {
            const img = this.add.image(s.x, s.y, s.key).setScale(0).setDepth(5).setAlpha(0)
            this.tweens.add({ targets: img, scaleX: 0.5, scaleY: 0.5, alpha: 1, duration: 500, ease: 'Back.Out' })
            this.tweens.add({ targets: img, y: s.y - 12, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
            return img
        })

        const noteKeys = ['music_m', 'music_p', 'music_c']
        const notePositions = [
            { x: W*0.3, y: H*0.15 },
            { x: W*0.5, y: H*0.1  },
            { x: W*0.7, y: H*0.15 },
        ]
        this._noteImgs = noteKeys.map((k, i) => {
            const n = this.add.image(notePositions[i].x, notePositions[i].y, k)
                .setScale(0.18).setDepth(6).setAlpha(0)
            this.tweens.add({ targets: n, alpha: 1, duration: 600, delay: 300 + i * 200 })
            this.tweens.add({ targets: n, y: notePositions[i].y - 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: i * 150 })
            return n
        })

        this.sound.play('sparkle', { volume: 0.8 })

        this.time.delayedCall(2000, () => this._combineNotes())
    }

    _combineNotes() {
        const W = this.W, H = this.H

        this._noteImgs.forEach(n => {
            this.tweens.add({ targets: n, x: W/2, y: H*0.12, scaleX: 0.25, scaleY: 0.25, duration: 600, ease: 'Power2' })
        })

        this.time.delayedCall(700, () => {
            this._noteImgs.forEach(n => n.destroy())
            const flash = this.add.graphics().setDepth(10)
            flash.fillStyle(0xFFD700, 0.8).fillCircle(this.W/2, this.H*0.12, 40)
            this.tweens.add({ targets: flash, alpha: 0, duration: 600, onComplete: () => flash.destroy() })
            this.sound.play('sparkle', { volume: 1.0 })

            this.time.delayedCall(400, () => this._startDialogue())
        })
    }

    _startDialogue() {
        this._runDialogue([
            { name: 'POPPY',  text: "You kept your promise!",                    portrait: 'poppy_h'  },
            { name: 'CITRUS', text: "Now we keep ours!",                         portrait: 'citrus_h' },
            { name: 'MELODY', text: "Watch closely!",                            portrait: 'melody_h' },
            { name: 'NARRATOR', text: "*POOF! POOF! POOF!*",                     portrait: 'lia_sur'  },
            { name: 'NARRATOR', text: "*The bedroom returns to normal*",         portrait: 'lia_sur'  },
            { name: 'LIA',    text: "It's... it's FIXED!",                       portrait: 'lia_sur'  },
            { name: 'POPPY',  text: "Of course it is! I'm the WORLD'S GREATEST DETECTIVE!", portrait: 'poppy_p' },
            { name: 'LIA',    text: "You didn't do anything!",                   portrait: 'lia_an'   },
            { name: 'POPPY',  text: "I BELIEVED IN YOU! That's something!",      portrait: 'poppy_h'  },
            { name: 'CITRUS', text: "Come visit anytime! I'll cook something!",   portrait: 'citrus_e' },
            { name: 'LIA',    text: "Please don't.",                              portrait: 'lia_an'   },
            { name: 'MELODY', text: "I'll play you a song!",                     portrait: 'melody_e' },
            { name: 'LIA',    text: "PLEASE DON'T.",                             portrait: 'lia_an'   },
            { name: 'NARRATOR', text: "*Spirits wave goodbye*",                  portrait: 'lia_sur'  },
            { name: 'ALL',    text: "BYE LIA!",                                  portrait: 'lia_sur'  },
            { name: 'NARRATOR', text: "*Spirits disappear*",                     portrait: 'lia_h'    },
            { name: 'LIA',    text: "Finally... peace and quiet...",             portrait: 'lia_h'    },
            { name: 'NARRATOR', text: "*Lia sits on couch*",                     portrait: 'lia_h'    },
            { name: 'POPPY',  text: "BOO!",                                      portrait: 'poppy_h'  },
            { name: 'LIA',    text: "AAAAHHHH!",                                 portrait: 'lia_sur'  },
            { name: 'POPPY',  text: "We live here now!",                         portrait: 'poppy_p'  },
            { name: 'LIA',    text: "*Deep sigh*",                               portrait: 'lia_s'    },
        ], () => this._showFinalScreen())
    }

    _showFinalScreen() {
        const W = this.W, H = this.H
        const minutes = GameState.minutesPlayed()

        if (this._spiritImgs) {
            this._spiritImgs.forEach(s => this.tweens.add({ targets: s, alpha: 0, duration: 600 }))
        }

        const ov2 = this.add.graphics().setDepth(20)
        ov2.fillStyle(0x000000, 0.75).fillRect(0, 0, W, H)
        ov2.setAlpha(0)
        this.tweens.add({ targets: ov2, alpha: 1, duration: 800 })

        const lines = [
            { text: 'THE END... OR IS IT?', size: '52px', color: '#FFD700', y: H*0.3 },
            { text: 'Thanks for playing!',  size: '32px', color: '#ffffff',  y: H*0.42 },
            { text: 'Notes Collected: 3 / 3', size: '28px', color: '#00ffcc', y: H*0.52 },
            { text: 'Time played: ' + minutes + ' minutes', size: '24px', color: '#aaaaaa', y: H*0.60 },
        ]

        lines.forEach((l, i) => {
            const t = this.add.text(W/2, l.y, l.text, {
                fontFamily: 'VT323', fontSize: l.size, color: l.color,
                stroke: '#000', strokeThickness: 4, align: 'center'
            }).setOrigin(0.5).setDepth(21).setAlpha(0)
            this.tweens.add({ targets: t, alpha: 1, duration: 500, delay: 800 + i * 400 })
        })

        const restart = this.add.text(W/2, H*0.78, 'Press SPACE to play again', {
            fontFamily: 'VT323', fontSize: '24px', color: '#ffffff'
        }).setOrigin(0.5).setDepth(21).setAlpha(0)
        this.tweens.add({ targets: restart, alpha: 0.6, duration: 400, delay: 2400 })
        this.tweens.add({ targets: restart, alpha: 0.1, duration: 700, yoyo: true, repeat: -1, delay: 3000 })

        this.time.delayedCall(2500, () => {
            const go = () => {
                GameState.reset()
                this.cameras.main.fadeOut(600, 0, 0, 0)
                this.time.delayedCall(650, () => this.scene.start('TitleScene'))
            }
            this.input.keyboard.once('keydown-SPACE', go)
            this.input.once('pointerdown', go)
        })
    }

    _buildDialogueBox() {
        const W = this.W, H = this.H
        const BOX_H = 100, BOX_Y = H - BOX_H
        this._dlgContainer = this.add.container(0, 0).setDepth(30).setAlpha(0)
        const bg = this.add.graphics()
        bg.fillStyle(0x000000, 0.75).fillRoundedRect(0, BOX_Y, W, BOX_H, 8)
        bg.lineStyle(3, 0xffffff, 1).strokeRoundedRect(0, BOX_Y, W, BOX_H, 8)
        const nameBox = this.add.graphics()
        nameBox.fillStyle(0x000080, 1).fillRoundedRect(8, BOX_Y+8, 160, 65, 4)
        nameBox.lineStyle(2, 0xFFD700, 1).strokeRoundedRect(8, BOX_Y+8, 160, 65, 4)
        const textBg = this.add.graphics()
        textBg.fillStyle(0x1a1a1a, 1).fillRoundedRect(178, BOX_Y+8, W-188, 65, 4)
        const ps = this.add.text(W-8, H-8, 'v SPACE', { fontFamily:'VT323', fontSize:'15px', color:'#ffffff' }).setOrigin(1, 1)
        this.tweens.add({ targets: ps, alpha: 0.15, duration: 480, yoyo: true, repeat: -1 })
        this._dlgName    = this.add.text(88, BOX_Y+38, '', { fontFamily:'VT323', fontSize:'18px', color:'#FFD700' }).setOrigin(0.5)
        this._dlgBody    = this.add.text(188, BOX_Y+14, '', { fontFamily:'VT323', fontSize:'22px', color:'#ffffff', wordWrap:{ width:W-208 }, lineSpacing:3 })
        this._dlgPortrait = this.add.image(88, BOX_Y-38, 'lia_stand').setScale(0.32).setDepth(31).setAlpha(0).setVisible(false)
        this._dlgContainer.add([bg, nameBox, textBg, ps, this._dlgName, this._dlgBody])
        this.input.keyboard.on('keydown-SPACE', () => this._advanceDlg())
        this.input.on('pointerdown', () => this._advanceDlg())
    }

    _runDialogue(lines, onDone) {
        this._dlgQueue = lines; this._dlgIndex = 0; this._dlgOnDone = onDone || null
        this._showDlgLine()
    }

    _showDlgLine() {
        if (this._dlgIndex >= this._dlgQueue.length) { this._closeDlg(); return }
        const line = this._dlgQueue[this._dlgIndex]
        this._dlgActive = true
        this.tweens.add({ targets: this._dlgContainer, alpha: 1, duration: 180 })
        this._dlgName.setText(line.name)
        this._dlgBody.setText('')
        if (line.portrait && this.textures.exists(line.portrait)) {
            this._dlgPortrait.setTexture(line.portrait).setVisible(true)
            this.tweens.add({ targets: this._dlgPortrait, alpha: 1, duration: 180 })
        }
        const txt = line.text; let i = 0
        this._typeTimer = this.time.addEvent({ delay: 36, repeat: txt.length-1, callback: () => { i++; this._dlgBody.setText(txt.substring(0, i)) } })
    }

    _advanceDlg() {
        if (!this._dlgActive) return
        if (this._typeTimer && this._typeTimer.getRepeatCount() > 0) {
            this._typeTimer.remove()
            this._dlgBody.setText(this._dlgQueue[this._dlgIndex].text)
            return
        }
        this._dlgIndex++
        this._showDlgLine()
    }

    _closeDlg() {
        this._dlgActive = false
        this.tweens.add({ targets: this._dlgContainer, alpha: 0, duration: 280 })
        this.tweens.add({ targets: this._dlgPortrait, alpha: 0, duration: 280, onComplete: () => this._dlgPortrait.setVisible(false) })
        if (this._dlgOnDone) { const cb = this._dlgOnDone; this._dlgOnDone = null; this.time.delayedCall(200, cb) }
    }
}
