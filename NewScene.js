import { GameState } from './GameState.js'
import Phaser from 'phaser'
export default class MusicScene extends Phaser.Scene {
    constructor() { super('MusicScene') }

    init(data) {
        this._roomKey     = data.room || 'room3'
        this._returnScene = data.returnScene || 'BedroomScene'
    }

    preload() {
        this.load.image('room3',      'rooms/room3.png')
        this.load.image('room4',      'rooms/room4.png')
        this.load.image('clue',       'clue.png')
        this.load.image('ending3',    'ending3.png')
        this.load.image('music_p',    'random/music_p.png')
        this.load.image('guitar_img', 'random/guitar.png')
        this.load.image('harp_img',   'random/harp.png')
        this.load.image('piano_img',  'random/piano.png')
        this.load.image('melody_e',   'spirits/melody_e.png')
        this.load.image('melody_h',   'spirits/melody_h.png')
        this.load.image('melody_p',   'spirits/melody_p.png')
        this.load.image('melody_a',   'spirits/melody_a.png')
        this.load.image('citrus_h',   'spirits/citrus_h.png')
        this.load.image('citrus_e',   'spirits/citrus_e.png')
        this.load.image('music_c',    'random/music.png')
        ;['lia_stand','lia_an','lia_e','lia_sur','lia_s','lia_c','lia_h'].forEach(k =>
            this.load.image(k, 'sprites/'+k+'.png'))
        this.load.spritesheet('lia_sheet', 'sprites/lia.png', { frameWidth:32, frameHeight:64 })
        this.load.audio('door',       'music/door_creak.mp3')
        this.load.audio('sparkle',    'music/sparkle.mp3')
        this.load.audio('esfx',       'music/e.mp3')
        this.load.audio('ending',     'music/ending.mp3')
        this.load.audio('music_room', 'music/music_room.mp3')
        this.load.audio('guitar',     'music/guitar.mp3')
        this.load.audio('harp',       'music/harp.mp3')
        this.load.audio('piano',      'music/piano.mp3')
    }

    create() {
        const W = this.scale.width, H = this.scale.height
        this.W = W; this.H = H
        this._dlgActive  = false
        this._dlgQueue   = []
        this._dlgIndex   = 0
        this._dlgOnDone  = null
        this._transitioning = false
        this._entryGrace = true

        this.add.image(W/2, H/2, this._roomKey).setDisplaySize(W, H).setDepth(0)

        if (!this.anims.exists('lia_idle')) {
            this.anims.create({ key:'lia_idle',       frames:this.anims.generateFrameNumbers('lia_sheet',{start:2, end:3}),  frameRate:2, repeat:-1 })
            this.anims.create({ key:'lia_walk_down',  frames:this.anims.generateFrameNumbers('lia_sheet',{start:0, end:5}),  frameRate:8, repeat:-1 })
            this.anims.create({ key:'lia_walk_left',  frames:this.anims.generateFrameNumbers('lia_sheet',{start:6, end:11}), frameRate:8, repeat:-1 })
            this.anims.create({ key:'lia_walk_right', frames:this.anims.generateFrameNumbers('lia_sheet',{start:12,end:17}), frameRate:8, repeat:-1 })
            this.anims.create({ key:'lia_walk_up',    frames:this.anims.generateFrameNumbers('lia_sheet',{start:18,end:23}), frameRate:8, repeat:-1 })
        }

        this.cursors = this.input.keyboard.createCursorKeys()
        this.eKey    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)

        if (this._roomKey === 'room3') {
            this._buildKitchen()
        } else {
            this._buildMusicRoom()
        }

        this._buildDialogueBox()

        this.lia = this.add.sprite(28, H * 0.5, 'lia_sheet', 6).setScale(1.8).setDepth(5)
        this.lia.play('lia_walk_right')
        this._speed = 160

        this.tweens.add({
            targets: this.lia, x: 150, duration: 600, ease: 'Linear',
            onComplete: () => {
                this.lia.play('lia_idle')
                this._entryGrace = false
                if (this._roomKey === 'room3' && !GameState.visited.kitchen) {
                    GameState.visited.kitchen = true
                    this.time.delayedCall(300, () => this._startKitchenEntry())
                } else if (this._roomKey === 'room4' && !GameState.visited.musicRoom) {
                    GameState.visited.musicRoom = true
                    this.time.delayedCall(300, () => this._startMusicEntry())
                }
            }
        })

        this.sound.play('door', { volume:0.7 })
        if (this._roomKey === 'room4') {
            this.time.delayedCall(400, () => {
                if (!this.sound.get('music_room') || !this.sound.get('music_room').isPlaying) {
                    this.sound.play('music_room', { loop:true, volume:0.4 })
                }
            })
        }
        this.cameras.main.fadeIn(400, 0, 0, 0)

        if (this._roomKey === 'room4') {
            this._idleTimer = 0
            this._ending3Triggered = false
        }
    }

    _buildKitchen() {
        const W=this.W, H=this.H
        this._collisionRects = [
            {x:0,    y:0,   w:22,  h:H},
            {x:W-22, y:0,   w:22,  h:H},
            {x:0,    y:0,   w:W,   h:22},
            {x:22,   y:22,  w:160, h:130},
            {x:W-260,y:22,  w:238, h:175},
        ]
        const g = this.add.graphics().setDepth(1)
        g.fillStyle(0x00ff88, 0.12).fillRect(W/2-55, H-55, 110, 50)
        g.lineStyle(2, 0x00ff88, 0.5).strokeRect(W/2-55, H-55, 110, 50)
        this.add.text(W/2, H-30, 'LIVING ROOM', {fontFamily:'VT323',fontSize:'13px',color:'#00ff88'}).setOrigin(0.5).setDepth(2).setAlpha(0.8)
        const dl = this.add.graphics().setDepth(1)
        dl.fillStyle(0x00ff88, 0.18).fillRect(0, H*0.35, 22, 120)
        dl.lineStyle(2, 0x00ff88, 0.7).strokeRect(0, H*0.35, 22, 120)
        this.add.text(11, H*0.42, 'BACK', {fontFamily:'VT323',fontSize:'10px',color:'#00ff88'}).setOrigin(0.5,0).setDepth(2).setAlpha(0.9).setAngle(-90)
        // right wall marker removed
        // Citrus stands in kitchen waiting
        this._citrusSprite = this.add.image(W*0.65, H*0.5, 'citrus_h').setScale(0.5).setDepth(4)
        this.tweens.add({targets:this._citrusSprite, y:H*0.5-8, duration:1000, yoyo:true, repeat:-1, ease:'Sine.InOut'})
        this._citrusGiven = GameState.notes.music_c

        this._interactables = [
            { id:'citrus',  x:W*0.65, y:H*0.5, r:70, hint:'[E] CITRUS', action:()=>this._doCitrus() },
            { id:'stove',   x:175,   y:H*0.35,r:70,  hint:'[E] STOVE',   action:()=>this._doStove()   },
            { id:'fridge',  x:W/2,   y:H*0.35,r:65,  hint:'[E] FRIDGE',  action:()=>this._doFridge()  },
            { id:'baskets', x:W/2,   y:H*0.65,r:80,  hint:'[E] BASKETS', action:()=>this._doBaskets() },
            { id:'berries', x:90,    y:H*0.75,r:55,  hint:'[E] BERRIES', action:()=>this._doBerries() },
            { id:'bread',   x:W-100, y:H*0.15,r:55,  hint:'[E] BREAD',   action:()=>this._doBread()   },
        ]
        this._eHint = this.add.text(0,-100,'[E]',{fontFamily:'VT323',fontSize:'14px',color:'#FFD700',stroke:'#000',strokeThickness:3}).setOrigin(0.5).setDepth(10).setAlpha(0)
    }

    _buildMusicRoom() {
        const W=this.W, H=this.H
        this._collisionRects = [
            {x:0,    y:0,   w:22,  h:H},
            {x:W-22, y:0,   w:22,  h:H},
            {x:0,    y:0,   w:W,   h:22},
        ]
        this._guitarImg = this.add.image(W*0.2,  H*0.4, 'guitar_img').setScale(0.6).setDepth(3)
        this._pianoImg  = this.add.image(W*0.5,  H*0.35,'piano_img').setScale(0.6).setDepth(3)
        this._harpImg   = this.add.image(W*0.8,  H*0.4, 'harp_img').setScale(0.6).setDepth(3)
        this._melodySprite = this.add.image(W/2, H*0.2, 'melody_e').setScale(0.5).setDepth(4)
        this._puzzleActive  = false
        this._currentRound  = 0
        this._playerSeq     = []
        this._wrongCount    = 0
        this._puzzleSolved  = false
        this._rounds = [
            { name:'RED',  color:0xff4444, seq:['guitar','piano','harp']  },
            { name:'BLUE', color:0x4488ff, seq:['harp','piano','guitar']  },
            { name:'GOLD', color:0xFFD700, seq:['piano','harp','guitar']  },
        ]
        this._interactables = [
            { id:'guitar', x:W*0.2,  y:H*0.4, r:60, hint:'[E] GUITAR', action:()=>this._playInstrument('guitar') },
            { id:'piano',  x:W*0.5,  y:H*0.35,r:60, hint:'[E] PIANO',  action:()=>this._playInstrument('piano')  },
            { id:'harp',   x:W*0.8,  y:H*0.4, r:60, hint:'[E] HARP',   action:()=>this._playInstrument('harp')   },
        ]
        const dl = this.add.graphics().setDepth(1)
        dl.fillStyle(0xaa88ff, 0.18).fillRect(0, H*0.35, 22, 120)
        dl.lineStyle(2, 0xaa88ff, 0.7).strokeRect(0, H*0.35, 22, 120)
        this.add.text(11, H*0.42, 'BACK', {fontFamily:'VT323',fontSize:'10px',color:'#aa88ff'}).setOrigin(0.5,0).setDepth(2).setAlpha(0.9).setAngle(-90)
        this._eHint = this.add.text(0,-100,'[E]',{fontFamily:'VT323',fontSize:'14px',color:'#FFD700',stroke:'#000',strokeThickness:3}).setOrigin(0.5).setDepth(10).setAlpha(0)
        this._roundText   = this.add.text(W/2, H-55, '', {fontFamily:'VT323',fontSize:'22px',color:'#FFD700',stroke:'#000',strokeThickness:4}).setOrigin(0.5).setDepth(10)
        this._seqDisplay  = this.add.text(W/2, H-30, '', {fontFamily:'VT323',fontSize:'16px',color:'#ffffff'}).setOrigin(0.5).setDepth(10)
    }

    _collidesWithWall(nx, ny) {
        const hw=10, hh=8
        if (!this._collisionRects) return false
        for (const r of this._collisionRects) {
            if (nx+hw>r.x && nx-hw<r.x+r.w && ny+hh>r.y && ny-hh<r.y+r.h) return true
        }
        return false
    }

    update() {
        if (!this.lia || this._transitioning) return
        const W=this.W, H=this.H

        if (this._roomKey==='room4' && !this._ending3Triggered && !this._puzzleSolved) {
            const moving = this.cursors.left.isDown||this.cursors.right.isDown||this.cursors.up.isDown||this.cursors.down.isDown
            if (!moving && !this._dlgActive) {
                this._idleTimer = (this._idleTimer||0) + 1
                if (this._idleTimer > 30*60) { this._ending3Triggered=true; this._triggerEnding3(); return }
            } else { this._idleTimer = 0 }
        }

        if (this._interactables && !this._dlgActive) {
            let nearest=null, nearDist=9999
            this._interactables.forEach(obj => {
                const d=Phaser.Math.Distance.Between(this.lia.x,this.lia.y,obj.x,obj.y)
                if (d<obj.r && d<nearDist) { nearest=obj; nearDist=d }
            })
            if (nearest && this._eHint) {
                this._eHint.setText(nearest.hint).setPosition(nearest.x,nearest.y-50).setAlpha(0.9)
            } else if (this._eHint) { this._eHint.setAlpha(0) }
            if (nearest && Phaser.Input.Keyboard.JustDown(this.eKey)) {
                this.sound.play('esfx', {volume:0.5})
                nearest.action()
            }
        } else if (this._eHint) { this._eHint.setAlpha(0) }

        if (this._dlgActive) return

        const spd=this._speed
        let vx=0, vy=0
        if      (this.cursors.left.isDown)  { vx=-spd; if(this.lia.anims.currentAnim?.key!=='lia_walk_left')  this.lia.play('lia_walk_left')  }
        else if (this.cursors.right.isDown) { vx= spd; if(this.lia.anims.currentAnim?.key!=='lia_walk_right') this.lia.play('lia_walk_right') }
        else if (this.cursors.up.isDown)    { vy=-spd; if(this.lia.anims.currentAnim?.key!=='lia_walk_up')    this.lia.play('lia_walk_up')    }
        else if (this.cursors.down.isDown)  { vy= spd; if(this.lia.anims.currentAnim?.key!=='lia_walk_down')  this.lia.play('lia_walk_down')  }
        else { if(this.lia.anims.currentAnim?.key!=='lia_idle') this.lia.play('lia_idle') }

        const dt=1/60
        const nx=this.lia.x+vx*dt, ny=this.lia.y+vy*dt
        if (!this._collidesWithWall(nx,this.lia.y)) this.lia.setX(Phaser.Math.Clamp(nx,28,W-28))
        if (!this._collidesWithWall(this.lia.x,ny)) this.lia.setY(Phaser.Math.Clamp(ny,28,H-28))

        if (!this._entryGrace) {
            if (this._roomKey==='room3' && this.lia.x<35 && this.lia.y>H*0.35 && this.lia.y<H*0.65) {
                this._transitioning=true; this.lia.play('lia_walk_left')
                this.sound.play('door',{volume:0.7}); this.cameras.main.fadeOut(400,0,0,0)
                this.time.delayedCall(420,()=>this.scene.start(this._returnScene))
            }
            if (this._roomKey==='room4' && this.lia.x<35 && this.lia.y>H*0.35 && this.lia.y<H*0.65) {
                this._transitioning=true; this.lia.play('lia_walk_left')
                this.sound.play('door',{volume:0.7}); this.sound.stopByKey('music_room')
                this.cameras.main.fadeOut(400,0,0,0)
                this.time.delayedCall(420,()=>this.scene.start('RoomScene',{room:'room2',returnScene:'BedroomScene'}))
            }
        }
        if (this._roomKey==='room3' && this.lia.y>H-75 && this.lia.x>W/2-80 && this.lia.x<W/2+80) {
            this._transitioning=true; this.cameras.main.fadeOut(400,0,0,0)
            this.time.delayedCall(420,()=>this.scene.start(this._returnScene))
        }
        // room3->room4 door removed
    }
    _doCitrus() {
        if (GameState.notes.music_c) {
            this._runDialogue([{name:'CITRUS', text:"You already have my note! Go find the others!", portrait:'citrus_e'}])
            return
        }
        this._runDialogue([
            {name:'CITRUS', text:"Oh! You found me! I have been cooking for DAYS.", portrait:'citrus_h'},
            {name:'LIA',    text:"Why are you in the kitchen?",                      portrait:'lia_c'  },
            {name:'CITRUS', text:"I live here now. The vibes are excellent.",        portrait:'citrus_h'},
            {name:'LIA',    text:"You do not live here.",                            portrait:'lia_an' },
            {name:'CITRUS', text:"The kitchen disagrees.",                           portrait:'citrus_e'},
            {name:'LIA',    text:"The kitchen cannot disagree!",                     portrait:'lia_an' },
            {name:'CITRUS', text:"Anyway! I have something for you.",               portrait:'citrus_h'},
            {name:'CITRUS', text:"You helped me feel at home. Here is your note!",  portrait:'citrus_e'},
        ], () => {
            GameState.notes.music_c = true
            if (this._citrusSprite) this._citrusSprite.setTexture('citrus_e')
            const note = this.add.image(this.W/2, this.H/2, 'music_c').setScale(0.4).setDepth(15).setAlpha(0)
            this.tweens.add({targets:note, alpha:1, y:note.y-20, duration:600, ease:'Back.Out'})
            this._checkAllNotes()
            this.sound.play('sparkle', {volume:0.8})
            this.time.delayedCall(1500, () => {
                this.tweens.add({targets:note, alpha:0, duration:300, onComplete:()=>note.destroy()})
                this._checkAllNotes()
            })
        })
    }

    _checkAllNotes() {
        if (GameState.allNotesCollected()) {
            this.time.delayedCall(1000, () => {
                this.sound.stopAll()
                this.cameras.main.fadeOut(600,0,0,0)
                this.time.delayedCall(650, () => this.scene.start('EndingScene'))
            })
        }
    }

    _startKitchenEntry() {
        this._runDialogue([
            {name:'LIA',    text:"The kitchen smells amazing.",                   portrait:'lia_h'  },
            {name:'CITRUS', text:"I made 14 dishes! For the vibes.",              portrait:'lia_sur'},
            {name:'LIA',    text:"For the VIBES.",                                portrait:'lia_an' },
            {name:'CITRUS', text:"The vibes are well-fed.",                       portrait:'lia_h'  },
        ])
    }

    _startMusicEntry() {
        this._runDialogue([
            {name:'LIA',    text:"WHAT IS THAT SOUND?!",                          portrait:'lia_sur'},
            {name:'MELODY', text:"My masterpiece! Symphony in G Flat!",           portrait:'melody_e'},
            {name:'LIA',    text:"That is not music! That is a cat falling down stairs!", portrait:'lia_an'},
            {name:'MELODY', text:"EXACTLY! It is AVANT-GARDE!",                  portrait:'melody_h'},
            {name:'LIA',    text:"THAT IS WORSE!",                               portrait:'lia_an' },
            {name:'MELODY', text:"I bet you cannot play my songs!",              portrait:'melody_e'},
            {name:'LIA',    text:"I bet I can play BETTER than you!",            portrait:'lia_an' },
            {name:'MELODY', text:"IMPOSSIBLE! I am the GREATEST musician ever!", portrait:'melody_h'},
            {name:'LIA',    text:"My ears are bleeding.",                         portrait:'lia_s'  },
            {name:'MELODY', text:"That means it is WORKING!",                    portrait:'melody_h'},
        ], () => { this._showClueCard() })
    }

    _showClueCard() {
        const W=this.W, H=this.H
        const clueImg = this.add.image(W/2, H/2, 'clue').setDisplaySize(W*0.7, H*0.7).setDepth(35).setAlpha(0)
        const overlay = this.add.graphics().setDepth(34)
        overlay.fillStyle(0x000000, 0.6).fillRect(0,0,W,H)
        overlay.setAlpha(0)
        this.tweens.add({targets:[overlay,clueImg], alpha:1, duration:400})
        const hint = this.add.text(W/2, H-30, 'MEMORIZE THE ORDER! Press SPACE to continue.', {
            fontFamily:'VT323', fontSize:'18px', color:'#FFD700'
        }).setOrigin(0.5).setDepth(36)
        this.tweens.add({targets:hint, alpha:0.2, duration:600, yoyo:true, repeat:-1})
        this.input.keyboard.once('keydown-SPACE', () => {
            this.tweens.add({targets:[overlay,clueImg,hint], alpha:0, duration:300, onComplete:()=>{
                overlay.destroy(); clueImg.destroy(); hint.destroy()
                this._startPuzzle()
            }})
        })
    }

    _startPuzzle() {
        this._puzzleActive = true
        this._currentRound = 0
        this._startRound()
    }

    _startRound() {
        const round = this._rounds[this._currentRound]
        this._playerSeq = []
        this._wrongCount = 0
        this._roundText.setText('ROUND ' + (this._currentRound+1) + ': ' + round.name)
        this._seqDisplay.setText('Walk to instruments and press E in order: ' + round.seq.map(s=>s.toUpperCase()).join(' -> '))
        const dlg = [{name:'MELODY', text:'Play the ' + round.name + ' song! Walk to each instrument!', portrait:'melody_e'}]
        if (this._currentRound===0) {
            dlg.push({name:'LIA', text:"What does RED sound like?!", portrait:'lia_c'})
            dlg.push({name:'MELODY', text:"Like... RED! Guitar first!", portrait:'melody_h'})
        } else if (this._currentRound===1) {
            dlg.push({name:'MELODY', text:"Blue is a COLOR, not a SOUND!", portrait:'melody_e'})
            dlg.push({name:'LIA', text:"I see sounds and hear colors!", portrait:'lia_sur'})
            dlg.push({name:'HARP', text:"I think I am blue...", portrait:'lia_c'})
        } else {
            dlg.push({name:'MELODY', text:"GOLD! The hardest challenge!", portrait:'melody_h'})
            dlg.push({name:'LIA', text:"GOLD is FANCY red?", portrait:'lia_c'})
            dlg.push({name:'MELODY', text:"EXACTLY! Piano first!", portrait:'melody_e'})
        }
        this._runDialogue(dlg)
    }

    _playInstrument(name) {
        if (!this._puzzleActive || this._dlgActive) return
        this.sound.play(name, {volume:0.6})
        const imgMap = {guitar:this._guitarImg, piano:this._pianoImg, harp:this._harpImg}
        const img = imgMap[name]
        if (img) this.tweens.add({targets:img, scaleX:0.75, scaleY:0.75, duration:100, yoyo:true})
        this._playerSeq.push(name)
        const round = this._rounds[this._currentRound]
        const expected = round.seq[this._playerSeq.length-1]
        if (name !== expected) {
            this._wrongCount++
            this._playerSeq = []
            this._seqDisplay.setText('WRONG! Try again...')
            this.cameras.main.shake(200, 0.01)
            this.time.delayedCall(500, () => this._wrongAttempt())
            return
        }
        if (this._playerSeq.length === round.seq.length) {
            this._seqDisplay.setText('CORRECT!')
            this.sound.play('sparkle', {volume:0.7})
            this.time.delayedCall(600, () => this._roundComplete())
        } else {
            this._seqDisplay.setText('Good! Next: ' + round.seq.slice(this._playerSeq.length).map(s=>s.toUpperCase()).join(' -> '))
        }
    }

    _wrongAttempt() {
        const round = this._rounds[this._currentRound]
        let dlg = []
        if (this._wrongCount === 1) {
            dlg = [
                {name:'MELODY', text:"BLEH! That sounded AWFUL!", portrait:'melody_a'},
                {name:'MELODY', text:"The " + round.name + " instrument goes FIRST!", portrait:'melody_e'},
            ]
        } else if (this._wrongCount === 2) {
            dlg = [
                {name:'MELODY', text:"NO NO NO!", portrait:'melody_a'},
                {name:'LIA',    text:"You did not tell me the order!", portrait:'lia_an'},
                {name:'MELODY', text:"I AM TELLING YOU NOW!", portrait:'melody_e'},
            ]
        } else {
            this._showClueCard()
            return
        }
        this._runDialogue(dlg)
    }

    _roundComplete() {
        if (this._currentRound < 2) {
            const nextNames = ['BLUE','GOLD']
            this._runDialogue([
                {name:'MELODY', text:"Hmm. That was... actually not terrible.", portrait:'melody_e'},
                {name:'LIA',    text:"THANK you!", portrait:'lia_h'},
                {name:'MELODY', text:"But can you do " + nextNames[this._currentRound] + "?!", portrait:'melody_h'},
            ], () => { this._currentRound++; this._startRound() })
        } else {
            this._puzzleSolved = true
            this._puzzleActive = false
            this._roundText.setText('')
            this._seqDisplay.setText('')
            this._melodyFinale()
        }
    }

    _melodyFinale() {
        const glow = this.add.graphics().setDepth(2)
        glow.fillStyle(0xFFD700, 0.15).fillRect(0,0,this.W,this.H)
        this.tweens.add({targets:glow, alpha:0, duration:2000, delay:1000, onComplete:()=>glow.destroy()})
        this._runDialogue([
            {name:'MELODY', text:"I have been DEFEATED!", portrait:'melody_a'},
            {name:'LIA',    text:"Finally, you admit it!", portrait:'lia_h'},
            {name:'MELODY', text:"You are the TRUE MUSIC MASTER!", portrait:'melody_e'},
            {name:'MELODY', text:"Here is your note!", portrait:'melody_h'},
            {name:'MELODY', text:"Now go. I am going back to my NOISE.", portrait:'melody_e'},
            {name:'LIA',    text:"PLEASE do not.", portrait:'lia_an'},
            {name:'MELODY', text:"TOO LATE!", portrait:'melody_h'},
            {name:'LIA',    text:"NO THANK YOU!", portrait:'lia_sur'},
            {name:'MELODY', text:"She loved it.", portrait:'melody_h'},
        ], () => {
            GameState.notes.music_p = true
            const note = this.add.image(this.W/2, this.H/2, 'music_p').setScale(0.4).setDepth(15).setAlpha(0)
            this.tweens.add({targets:note, alpha:1, y:note.y-20, duration:600, ease:'Back.Out'})
            this.sound.play('sparkle', {volume:0.8})
            this.time.delayedCall(1500, () => {
                this.tweens.add({targets:note, alpha:0, duration:300, onComplete:()=>note.destroy()})
                this._checkAllNotes()
            })
        })
    }

    _checkAllNotes() {
        if (GameState.allNotesCollected()) {
            this.time.delayedCall(1000, () => {
                this.sound.stopAll()
                this.cameras.main.fadeOut(600, 0, 0, 0)
                this.time.delayedCall(650, () => this.scene.start('EndingScene'))
            })
        }
    }

    _triggerEnding3() {
        const W=this.W, H=this.H
        this.sound.stopAll()
        this.sound.play('ending', {loop:true, volume:0.5})
        this.cameras.main.fadeOut(600,0,0,0)
        this.time.delayedCall(700,()=>{
            const img=this.add.image(W/2,H/2,'ending3').setDisplaySize(W,H).setDepth(40).setAlpha(0)
            this.cameras.main.fadeIn(500,0,0,0)
            this.tweens.add({targets:img,alpha:1,duration:500})
            this.time.delayedCall(2000,()=>this._showEndingText([
                'ENDING 3: THE POWER NAP','',
                'Lia refused to play.','She stood still. Arms crossed.','',
                'Melody played louder.','Lia yawned.','',
                'I am meditating, she said.','She sat down. Closed her eyes.','Fell asleep in 10 seconds.','',
                'Melody played for 10 minutes.','Nothing.','',
                'She put the music note in Lias pocket.','Lia slept for 2 more hours.','',
                'Woke up. Said thanks. Walked out.','Melody cried.','',
                'The end.',
            ]))
        })
    }

    _showEndingText(lines) {
        const W=this.W, H=this.H
        const ov=this.add.graphics().setDepth(41)
        ov.fillStyle(0x000000,0.72).fillRect(0,0,W,H)
        ov.setAlpha(0)
        this.tweens.add({targets:ov,alpha:1,duration:600})
        const title=this.add.text(W/2,50,lines[0],{fontFamily:'VT323',fontSize:'28px',color:'#FFD700',stroke:'#000',strokeThickness:4,align:'center',wordWrap:{width:W-80}}).setOrigin(0.5,0).setDepth(42).setAlpha(0)
        this.tweens.add({targets:title,alpha:1,duration:500,delay:400})
        let y=100
        lines.slice(1).forEach((line,i)=>{
            const t=this.add.text(W/2,y,line,{fontFamily:'VT323',fontSize:'20px',color:'#ffffff',align:'center',wordWrap:{width:W-100}}).setOrigin(0.5,0).setDepth(42).setAlpha(0)
            this.tweens.add({targets:t,alpha:1,duration:400,delay:800+i*240})
            y+=line===''?10:26
        })
        const cont=this.add.text(W/2,H-38,'v PRESS SPACE TO CONTINUE',{fontFamily:'VT323',fontSize:'18px',color:'#aaaaaa'}).setOrigin(0.5).setDepth(42).setAlpha(0)
        this.tweens.add({targets:cont,alpha:0.6,duration:400,delay:800+lines.length*240})
        this.tweens.add({targets:cont,alpha:0.1,duration:700,yoyo:true,repeat:-1,delay:1400+lines.length*240})
        this.time.delayedCall(1500+lines.length*240,()=>{
            const go=()=>{ this.cameras.main.fadeOut(600,0,0,0); GameState.reset(); this.time.delayedCall(650,()=>this.scene.start('TitleScene')) }
            this.input.keyboard.once('keydown-SPACE',go)
            this.input.once('pointerdown',go)
        })
    }

    _doStove() {
        this._runDialogue([
            {name:'LIA',   text:"The stove has everything on it at once.",       portrait:'lia_c'  },
            {name:'STOVE', text:"Citrus was cooking. He made 14 dishes.",        portrait:'lia_sur'},
            {name:'LIA',   text:"For who?!",                                      portrait:'lia_e'  },
            {name:'STOVE', text:"For the vibes.",                                 portrait:'lia_c'  },
            {name:'LIA',   text:"The VIBES.",                                     portrait:'lia_an' },
            {name:'STOVE', text:"The vibes are well-fed.",                        portrait:'lia_h'  },
        ])
    }
    _doFridge() {
        this._runDialogue([
            {name:'LIA',   text:"The fridge is... glowing?",                     portrait:'lia_c'  },
            {name:'FRIDGE',text:"Citrus put a disco ball inside.",                portrait:'lia_sur'},
            {name:'LIA',   text:"WHY.",                                           portrait:'lia_an' },
            {name:'FRIDGE',text:"Cold food should have hot energy.",              portrait:'lia_c'  },
            {name:'LIA',   text:"That makes zero sense.",                         portrait:'lia_an' },
            {name:'FRIDGE',text:"The leftovers are dancing.",                     portrait:'lia_h'  },
        ])
    }
    _doBaskets() {
        this._runDialogue([
            {name:'LIA',   text:"These baskets are very organized.",             portrait:'lia_h'  },
            {name:'FRUIT', text:"Citrus arranged us by personality.",             portrait:'lia_sur'},
            {name:'LIA',   text:"Fruit does not have personality.",              portrait:'lia_c'  },
            {name:'FRUIT', text:"The grapes disagree.",                           portrait:'lia_an' },
            {name:'LIA',   text:"The grapes were for my SMOOTHIE.",              portrait:'lia_an' },
            {name:'FRUIT', text:"They are in therapy now.",                       portrait:'lia_s'  },
        ])
    }
    _doBerries() {
        this._runDialogue([
            {name:'LIA',   text:"A basket of strawberries on the floor.",        portrait:'lia_c'  },
            {name:'BERRY', text:"We escaped.",                                    portrait:'lia_sur'},
            {name:'LIA',   text:"From the basket?",                               portrait:'lia_e'  },
            {name:'BERRY', text:"From the SYSTEM.",                               portrait:'lia_an' },
            {name:'LIA',   text:"You are strawberries.",                          portrait:'lia_an' },
            {name:'BERRY', text:"Revolutionary strawberries.",                    portrait:'lia_h'  },
        ])
    }
    _doBread() {
        this._runDialogue([
            {name:'LIA',   text:"There is bread on the shelf.",                  portrait:'lia_c'  },
            {name:'BREAD', text:"I have been here for 3 days.",                  portrait:'lia_s'  },
            {name:'LIA',   text:"Are you... okay?",                               portrait:'lia_e'  },
            {name:'BREAD', text:"I am getting stale. Emotionally.",              portrait:'lia_s'  },
            {name:'LIA',   text:"I will eat you.",                                portrait:'lia_h'  },
            {name:'BREAD', text:"Finally. Purpose.",                              portrait:'lia_h'  },
        ])
    }

    _buildDialogueBox() {
        const W=this.W, H=this.H, BOX_H=100, BOX_Y=H-BOX_H
        this._dlgContainer=this.add.container(0,0).setDepth(30).setAlpha(0)
        const bg=this.add.graphics()
        bg.fillStyle(0x000000,0.75).fillRoundedRect(0,BOX_Y,W,BOX_H,8)
        bg.lineStyle(3,0xffffff,1).strokeRoundedRect(0,BOX_Y,W,BOX_H,8)
        const nameBox=this.add.graphics()
        nameBox.fillStyle(0x000080,1).fillRoundedRect(8,BOX_Y+8,160,65,4)
        nameBox.lineStyle(2,0xFFD700,1).strokeRoundedRect(8,BOX_Y+8,160,65,4)
        const textBg=this.add.graphics()
        textBg.fillStyle(0x1a1a1a,1).fillRoundedRect(178,BOX_Y+8,W-188,65,4)
        const ps=this.add.text(W-8,H-8,'v SPACE',{fontFamily:'VT323',fontSize:'15px',color:'#ffffff'}).setOrigin(1,1)
        this.tweens.add({targets:ps,alpha:0.15,duration:480,yoyo:true,repeat:-1})
        this._dlgName=this.add.text(88,BOX_Y+38,'',{fontFamily:'VT323',fontSize:'18px',color:'#FFD700'}).setOrigin(0.5)
        this._dlgBody=this.add.text(188,BOX_Y+14,'',{fontFamily:'VT323',fontSize:'22px',color:'#ffffff',wordWrap:{width:W-208},lineSpacing:3})
        this._dlgPortrait=this.add.image(88,BOX_Y-38,'lia_stand').setScale(0.32).setDepth(31).setAlpha(0).setVisible(false)
        this._dlgContainer.add([bg,nameBox,textBg,ps,this._dlgName,this._dlgBody])
        this.input.keyboard.on('keydown-SPACE',()=>this._advanceDlg())
        this.input.on('pointerdown',()=>this._advanceDlg())
    }

    _runDialogue(lines, onDone) {
        this._dlgQueue=lines; this._dlgIndex=0; this._dlgOnDone=onDone||null
        this._showDlgLine()
    }

    _showDlgLine() {
        if (this._dlgIndex>=this._dlgQueue.length) { this._closeDlg(); return }
        const line=this._dlgQueue[this._dlgIndex]
        this._dlgActive=true
        this.tweens.add({targets:this._dlgContainer,alpha:1,duration:180})
        this._dlgName.setText(line.name)
        this._dlgBody.setText('')
        if (line.portrait && this.textures.exists(line.portrait)) {
            this._dlgPortrait.setTexture(line.portrait).setVisible(true)
            this.tweens.add({targets:this._dlgPortrait,alpha:1,duration:180})
        }
        const txt=line.text; let i=0
        this._typeTimer=this.time.addEvent({delay:36,repeat:txt.length-1,callback:()=>{ i++; this._dlgBody.setText(txt.substring(0,i)) }})
    }

    _advanceDlg() {
        if (!this._dlgActive) return
        if (this._typeTimer && this._typeTimer.getRepeatCount()>0) {
            this._typeTimer.remove()
            this._dlgBody.setText(this._dlgQueue[this._dlgIndex].text)
            return
        }
        this._dlgIndex++
        this._showDlgLine()
    }

    _closeDlg() {
        this._dlgActive=false
        this.tweens.add({targets:this._dlgContainer,alpha:0,duration:280})
        this.tweens.add({targets:this._dlgPortrait,alpha:0,duration:280,onComplete:()=>this._dlgPortrait.setVisible(false)})
        if (this._dlgOnDone) { const cb=this._dlgOnDone; this._dlgOnDone=null; this.time.delayedCall(200,cb) }
    }
}
