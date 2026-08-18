import Phaser from 'phaser'
import { GameState } from './GameState.js'
export default class TitleScene extends Phaser.Scene {
    constructor() { super('TitleScene') }

    preload() {
        this.load.image('introBg',  'intro.png')
        this.load.image('intro1Bg', 'intro1.png')
        this.load.image('poppy_h',  'spirits/poppy_h.png')
        this.load.image('citrus_e', 'spirits/citrus_e.png')
        this.load.image('melody_e', 'spirits/melody_e.png')
        this.load.audio('witch',  'music/witch.mp3')
        this.load.audio('witch1', 'music/witch1.mp3')
        this.load.audio('glitch', 'music/glitch.mp3')
    }

    create() {
        const W = this.scale.width, H = this.scale.height
        this._witchIdx = 0

        if (!document.getElementById('vt323-font')) {
            const s = document.createElement('style')
            s.id = 'vt323-font'
            s.textContent = "@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');"
            document.head.appendChild(s)
        }

        // Both images fill screen — bg1 visible, bg2 hidden underneath
        this._bgImg  = this.add.image(W/2, H/2, 'introBg').setDisplaySize(W, H).setDepth(0)
        this._bg2Img = this.add.image(W/2, H/2, 'intro1Bg').setDisplaySize(W, H).setDepth(0).setAlpha(0)
        this._glitchGfx = this.add.graphics().setDepth(49)

        // After 5s: glitch effect + glitch.mp3, then crossfade intro.png → intro1.png
        this.time.delayedCall(5000, () => {
            this.sound.play('glitch', { volume: 0.8 })
            let ticks = 0
            this.time.addEvent({
                delay: 55, repeat: 14,
                callback: () => {
                    ticks++
                    const W = this.scale.width, H = this.scale.height
                    const g = this._glitchGfx
                    g.clear()
                    for (let i = 0; i < Phaser.Math.Between(4, 12); i++) {
                        g.fillStyle(Phaser.Display.Color.GetColor(
                            Phaser.Math.Between(0,255), Phaser.Math.Between(0,255), Phaser.Math.Between(0,255)
                        ), Phaser.Math.FloatBetween(0.2, 0.75))
                        g.fillRect(Phaser.Math.Between(-50,50), Phaser.Math.Between(0,H), W, Phaser.Math.Between(2,20))
                    }
                    if (Math.random() > 0.6) { g.fillStyle(0xffffff, 0.15); g.fillRect(0,0,W,H) }
                    if (ticks >= 14) {
                        g.clear()
                        this.tweens.add({
                            targets: this._bgImg, alpha: 0, duration: 400,
                            onComplete: () => {
                                this.tweens.add({ targets: this._bg2Img, alpha: 1, duration: 400 })
                            }
                        })
                    }
                }
            })
        })

        // Dark gradient so menu text is readable on both backgrounds
        const grad = this.add.graphics().setDepth(1)
        grad.fillGradientStyle(0x000000,0x000000,0x000000,0x000000, 0,0,0.65,0.65)
        grad.fillRect(0, H*0.42, W, H*0.58)

        // Title
        this.add.text(W/2, H*0.50, "LIA'S HARMONIOUS HOUSE", {
            fontFamily:'VT323', fontSize:'62px', color:'#FFD700',
            stroke:'#000', strokeThickness:6,
            shadow:{offsetX:3,offsetY:3,color:'#ff00ff',blur:0,fill:true}
        }).setOrigin(0.5).setDepth(2)

        this.add.text(W/2, H*0.50+58, '~ A Cozy Haunted RPG ~', {
            fontFamily:'VT323', fontSize:'26px', color:'#ffffff'
        }).setOrigin(0.5).setAlpha(0.8).setDepth(2)

        // Menu
        const items = [
            { label:'> START GAME', cb:()=>this._startGame() },
            { label:'> OPTIONS',    cb:()=>this._options()   },
            { label:'> EXIT',       cb:()=>this._exit()      }
        ]
        this._menuIdx = 0
        this._menuItems = items.map((item,i) => {
            const t = this.add.text(W/2, H*0.50+118+i*52, item.label, {
                fontFamily:'VT323', fontSize:'36px',
                color: i===0 ? '#FFD700' : '#aaaaaa',
                stroke:'#000', strokeThickness:4
            }).setOrigin(0.5).setDepth(3).setInteractive({useHandCursor:true})
            t.on('pointerover', ()=>{ this._menuIdx=i; this._highlight() })
            t.on('pointerdown', ()=>item.cb())
            return {text:t, cb:item.cb}
        })

        this.input.keyboard.on('keydown-UP',    ()=>{ this._menuIdx=(this._menuIdx-1+items.length)%items.length; this._highlight() })
        this.input.keyboard.on('keydown-DOWN',  ()=>{ this._menuIdx=(this._menuIdx+1)%items.length; this._highlight() })
        this.input.keyboard.on('keydown-ENTER', ()=>this._menuItems[this._menuIdx].cb())
        this.input.keyboard.on('keydown-SPACE', ()=>this._menuItems[this._menuIdx].cb())

        const hint = this.add.text(W/2, H-22, 'ARROW KEYS + ENTER  |  SPACE TO SELECT', {
            fontFamily:'VT323', fontSize:'18px', color:'#ffffff'
        }).setOrigin(0.5).setAlpha(0.45).setDepth(3)
        this.tweens.add({targets:hint, alpha:0.1, duration:900, yoyo:true, repeat:-1})

        // Spirits — hidden until after glitch
        this._spirits = [
            { key:'poppy_h',  img:null, x:62,   y:62   },
            { key:'melody_e', img:null, x:W-62, y:62   },
            { key:'citrus_e', img:null, x:W-62, y:H-62 }
        ]
        this._spirits.forEach(s => {
            s.img = this.add.image(s.x, s.y, s.key).setScale(0.26).setAlpha(0).setDepth(20)
        })

        // Spirits start popping after the bg swap completes (~6.5s in)
        this.time.delayedCall(6500, () => this._scheduleScare())
    }

    _highlight() {
        this._menuItems.forEach((item,i) => {
            item.text.setColor(i===this._menuIdx ? '#FFD700' : '#aaaaaa')
            item.text.setFontSize(i===this._menuIdx ? '42px' : '36px')
        })
    }

    _scheduleScare() {
        this.time.delayedCall(Phaser.Math.Between(1500,4000), ()=>{
            if (!this.scene.isActive('TitleScene')) return
            this._doScare()
            this._scheduleScare()
        })
    }

    _doScare() {
        const chosen = Phaser.Utils.Array.Shuffle([...this._spirits]).slice(0, Phaser.Math.Between(1,2))
        this.sound.play(this._witchIdx%2===0 ? 'witch' : 'witch1', {volume:0.5})
        this._witchIdx++
        chosen.forEach(s => {
            this.tweens.killTweensOf(s.img)
            s.img.setAlpha(0).setScale(0.26)
            this.tweens.add({
                targets:s.img, alpha:1, scaleX:0.32, scaleY:0.32, duration:140, ease:'Back.Out',
                onComplete:()=>{
                    this.tweens.add({targets:s.img, x:s.x+Phaser.Math.Between(-6,6), y:s.y+Phaser.Math.Between(-6,6), duration:45, yoyo:true, repeat:5, onComplete:()=>s.img.setPosition(s.x,s.y)})
                    this.time.delayedCall(Phaser.Math.Between(350,800), ()=>{
                        this.tweens.add({targets:s.img, alpha:0, scaleX:0.26, scaleY:0.26, duration:200})
                    })
                }
            })
        })
    }

    _startGame() {
        GameState.reset()
        this.sound.stopAll()
        this.cameras.main.flash(300,255,255,255)
        this.time.delayedCall(320, ()=>this.scene.start('BedroomScene'))
    }
    _options() {
        const t = this.add.text(this.scale.width/2, this.scale.height/2, 'OPTIONS COMING SOON', {
            fontFamily:'VT323', fontSize:'38px', color:'#ff6666', backgroundColor:'#000000', padding:{x:16,y:8}
        }).setOrigin(0.5).setDepth(50)
        this.time.delayedCall(1500, ()=>t.destroy())
    }
    _exit() {
        this.add.text(this.scale.width/2, this.scale.height/2, 'GOODBYE!', {
            fontFamily:'VT323', fontSize:'72px', color:'#ff0000'
        }).setOrigin(0.5).setDepth(50)
        this.time.delayedCall(1200, ()=>window.close())
    }
}
