import { GameState } from './GameState.js'
import Phaser from 'phaser'
// RoomScene - Bedroom (room2) with bathroom, clues, interactions
export default class RoomScene extends Phaser.Scene {
    constructor() { super('RoomScene') }

    init(data) {
        this._roomKey     = data.room || 'room2'
        this._returnScene = data.returnScene || 'BedroomScene'
    }

    preload() {
        this.load.image('room2',    'rooms/room2.png')
        this.load.image('room3',    'rooms/room3.png')
        this.load.image('m1',       'm1.png')
        this.load.image('m2',       'm2.png')
        this.load.image('ending2',  'ending2.png')
        this.load.image('ending4',  'ending4.png')
        this.load.image('music_m',  'random/music_m.png')
        this.load.image('music_c',  'random/music.png')
        this.load.image('doll',     'bedroom/doll.png')
        this.load.image('poppy_a',  'spirits/poppy_a.png')
        this.load.image('poppy_p',  'spirits/poppy_p.png')
        this.load.image('poppy_h',  'spirits/poppy_h.png')
        this.load.image('citrus_h', 'spirits/citrus_h.png')
        this.load.image('citrus_e', 'spirits/citrus_e.png')
        this.load.image('citrus_a', 'spirits/citrus_a.png')
        ;['lia_stand','lia_an','lia_e','lia_sur','lia_s','lia_c','lia_h'].forEach(k =>
            this.load.image(k, 'sprites/'+k+'.png'))
        this.load.spritesheet('lia_sheet', 'sprites/lia.png', { frameWidth:32, frameHeight:64 })
        this.load.audio('witch',    'music/witch.mp3')
        this.load.audio('witch1',   'music/witch1.mp3')
        this.load.audio('door',     'music/door_creak.mp3')
        this.load.audio('sparkle',  'music/sparkle.mp3')
        this.load.audio('esfx',     'music/e.mp3')
        this.load.audio('bedroom',  'music/bedroom.mp3')
        this.load.audio('mirror',   'music/mirror.mp3')
        this.load.audio('ending',   'music/ending.mp3')
        this.load.audio('grape',    'music/grape.mp3')
        this.load.audio('strawberry','music/strawberry.mp3')
        this.load.audio('lemon',    'music/lemon.mp3')
    }

    create() {
        const W = this.scale.width, H = this.scale.height
        this.W = W; this.H = H
        this._dlgActive  = false
        this._dlgQueue   = []
        this._dlgIndex   = 0
        this._dlgOnDone  = null
        this._transitioning = false
        this._collected  = { doll:false, lamp:false, mirror:false }
        this._cluesFound = 0
        this._doorUnlocked = false

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

        if (this._roomKey === 'room2') {
            this._buildBedroom()
        } else {
            this._buildKitchen()
        }

        this._buildDialogueBox()
        this._buildHUD()

        // Lia enters from left gap
        this.lia = this.add.sprite(28, H * 0.42, 'lia_sheet', 6).setScale(1.8).setDepth(5)
        this._entryGrace = true  // prevent immediate exit on spawn
        this.lia.play('lia_walk_right')
        this._speed = 160

        this.tweens.add({
            targets: this.lia, x: 150, duration: 600, ease: 'Linear',
            onComplete: () => {
                this.lia.play('lia_idle')
                this._entryGrace = false  // now allow exits
                if (this._roomKey === 'room2' && !GameState.visited.bedroom) {
                    GameState.visited.bedroom = true
                    this.time.delayedCall(300, () => this._startEntryDialogue())
                }
            }
        })

        this.sound.play('door', { volume:0.7 })
        if (this._roomKey === 'room2') {
            this.time.delayedCall(400, () => {
                this.sound.play('bedroom', { loop:true, volume:0.4 })
            })
        }
        this.cameras.main.fadeIn(400, 0, 0, 0)
    }
    _buildBedroom() {
        const W=this.W, H=this.H

        // Collisions: outer walls + furniture tops only
        this._collisionRects = [
            {x:0,    y:0,   w:22,  h:H},
            {x:W-22, y:0,   w:22,  h:H},
            {x:0,    y:0,   w:W,   h:22},
            {x:22,   y:22,  w:310, h:55},
            {x:310,  y:22,  w:175, h:65},
            {x:485,  y:22,  w:295, h:90},
            {x:22,   y:H*0.53, w:130, h:100},
            {x:W-240,y:H*0.53, w:218, h:140},
        ]

        // HUD clue labels
        this._clueLabels = [
            { key:'doll',   label:'DOLLY',  x:W-195, y:26 },
            { key:'lamp',   label:'LAMPY',  x:W-145, y:26 },
            { key:'mirror', label:'MIRRY',  x:W-90,  y:26 },
        ]

        // Interactables
        this._interactables = [
            { id:'lamp',    x:75,    y:130,   r:55,  hint:'[E] LAMP',    action:()=>this._doLamp()    },
            { id:'bed',     x:175,   y:160,   r:65,  hint:'[E] BED',     action:()=>this._doBed()     },
            { id:'bunkbed', x:590,   y:150,   r:70,  hint:'[E] BUNK BED',action:()=>this._doBunkBed() },
            { id:'doll',    x:590,   y:220,   r:55,  hint:'[E] DOLL',    action:()=>this._doDoll()    },
            { id:'mirror',  x:W-155, y:H*0.72,r:75,  hint:'[E] MIRROR',  action:()=>this._doMirror()  },
            { id:'bathtub', x:175,   y:H*0.82,r:75,  hint:'[E] BATHTUB', action:()=>this._doBathtub() },
            { id:'plant',   x:W-55,  y:H*0.88,r:55,  hint:'[E] PLANT',   action:()=>this._doBathPlant()},
            { id:'toilet',  x:90,    y:H*0.62,r:55,  hint:'[E] TOILET',  action:()=>this._doToilet()  },
        ]

        // Left wall exit marker (back to living room)
        const dl = this.add.graphics().setDepth(1)
        dl.fillStyle(0x00ff88, 0.18).fillRect(0, H*0.3, 22, 130)
        dl.lineStyle(2, 0x00ff88, 0.7).strokeRect(0, H*0.3, 22, 130)
        this.add.text(11, H*0.37, 'BACK', {
            fontFamily:'VT323', fontSize:'10px', color:'#00ff88'
        }).setOrigin(0.5, 0).setDepth(2).setAlpha(0.9).setAngle(-90)

        // Room4 door - right wall opening (music room)
        const dr = this.add.graphics().setDepth(1)
        dr.fillStyle(0xaa88ff, 0.18).fillRect(W-22, H*0.3, 22, 130)
        dr.lineStyle(2, 0xaa88ff, 0.7).strokeRect(W-22, H*0.3, 22, 130)
        this.add.text(W-11, H*0.37, 'MUSIC', {
            fontFamily:'VT323', fontSize:'10px', color:'#aa88ff'
        }).setOrigin(0.5, 0).setDepth(2).setAlpha(0.9).setAngle(-90)

        this._eHint = this.add.text(0,-100,'[E]',{
            fontFamily:'VT323', fontSize:'14px', color:'#FFD700',
            stroke:'#000', strokeThickness:3
        }).setOrigin(0.5).setDepth(10).setAlpha(0)
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

        // Citrus stands in kitchen waiting
        this._citrusSprite = this.add.image(W*0.65, H*0.5, 'citrus_h').setScale(0.35).setDepth(4)
        this.tweens.add({ targets: this._citrusSprite, y: H*0.5-8, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.InOut' })

        this._interactables = [
            { id:'citrus',  x:W*0.65, y:H*0.5, r:70,  hint:'[E] CITRUS',  action:()=>this._doCitrus()  },
            { id:'stove',   x:175,   y:H*0.35,r:70,  hint:'[E] STOVE',   action:()=>this._doStove()   },
            { id:'fridge',  x:W/2,   y:H*0.35,r:65,  hint:'[E] FRIDGE',  action:()=>this._doFridge()  },
            { id:'baskets', x:W/2,   y:H*0.65,r:80,  hint:'[E] BASKETS', action:()=>this._doBaskets() },
            { id:'berries', x:90,    y:H*0.75,r:55,  hint:'[E] BERRIES', action:()=>this._doBerries() },
            { id:'bread',   x:W-100, y:H*0.15,r:55,  hint:'[E] BREAD',   action:()=>this._doBread()   },
        ]

        // Back door to living room at bottom
        const g = this.add.graphics().setDepth(1)
        g.fillStyle(0x00ff88, 0.12).fillRect(W/2-55, H-55, 110, 50)
        g.lineStyle(2, 0x00ff88, 0.5).strokeRect(W/2-55, H-55, 110, 50)
        this.add.text(W/2, H-30, 'LIVING ROOM', {
            fontFamily:'VT323', fontSize:'13px', color:'#00ff88'
        }).setOrigin(0.5).setDepth(2).setAlpha(0.8)

        this._eHint = this.add.text(0,-100,'[E]',{
            fontFamily:'VT323', fontSize:'14px', color:'#FFD700',
            stroke:'#000', strokeThickness:3
        }).setOrigin(0.5).setDepth(10).setAlpha(0)
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

        // Proximity hints + E key
        if (this._interactables && !this._dlgActive) {
            let nearest=null, nearDist=9999
            this._interactables.forEach(obj => {
                const d=Phaser.Math.Distance.Between(this.lia.x,this.lia.y,obj.x,obj.y)
                if (d<obj.r && d<nearDist) { nearest=obj; nearDist=d }
            })
            if (nearest && this._eHint) {
                this._eHint.setText(nearest.hint).setPosition(nearest.x,nearest.y-50).setAlpha(0.9)
            } else if (this._eHint) {
                this._eHint.setAlpha(0)
            }
            if (nearest && Phaser.Input.Keyboard.JustDown(this.eKey)) {
                this.sound.play('esfx', {volume:0.5})
                nearest.action()
            }
        } else if (this._eHint) {
            this._eHint.setAlpha(0)
        }

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

        // Room2 -> Room1 (left wall, same gap Lia entered from)
        if (!this._entryGrace && this._roomKey==='room2' && this.lia.x<35 && this.lia.y>H*0.3 && this.lia.y<H*0.3+130) {
            this._transitioning=true
            this.lia.play('lia_walk_left')
            this.sound.play('door',{volume:0.7})
            this.sound.stopByKey('bedroom')
            this.cameras.main.fadeOut(400,0,0,0)
            this.time.delayedCall(420,()=>this.scene.start(this._returnScene))
        }
        // Room2 -> Room4 door (right wall, music room)
        if (this._roomKey==='room2' && this.lia.x>W-35 && this.lia.y>H*0.3 && this.lia.y<H*0.3+130) {
            this._transitioning=true
            this.lia.play('lia_walk_right')
            this.sound.play('door',{volume:0.7})
            this.sound.stopByKey('bedroom')
            this.cameras.main.fadeOut(400,0,0,0)
            this.time.delayedCall(420,()=>this.scene.start('MusicScene',{room:'room4',returnScene:'RoomScene'}))
        }
        // Kitchen back door
        if (this._roomKey==='room3' && this.lia.y>H-75 && this.lia.x>W/2-80 && this.lia.x<W/2+80) {
            this._transitioning=true
            this.cameras.main.fadeOut(400,0,0,0)
            this.time.delayedCall(420,()=>this.scene.start(this._returnScene))
        }
    }
    // ENTRY DIALOGUE
    _startEntryDialogue() {
        this._runDialogue([
            {name:'POPPY',  text:"STOP! This is a CRIME SCENE!",                portrait:'poppy_a'},
            {name:'LIA',    text:"What crime?",                                  portrait:'lia_c'  },
            {name:'POPPY',  text:"SOMEONE moved my pillow 2 inches to the left!",portrait:'poppy_a'},
            {name:'LIA',    text:"That was probably YOU.",                        portrait:'lia_an' },
            {name:'POPPY',  text:"Impossible. I am the WORLD'S GREATEST DETECTIVE!", portrait:'poppy_p'},
            {name:'LIA',    text:"You're a floating pink blob.",                 portrait:'lia_e'  },
            {name:'POPPY',  text:"A FLOATING PINK BLOB DETECTIVE!",              portrait:'poppy_h'},
        ])
    }

    // DOLL
    _doDoll() {
        if (this._collected.doll) {
            this._runDialogue([{name:'DOLL',text:"Still traumatised from the fall.",portrait:'lia_s'}])
            return
        }
        if (!this._dollSprite) {
            this._dollSprite = this.add.image(590, 28, 'doll').setScale(1.2).setFlipY(true).setDepth(8)
            this.tweens.add({targets:this._dollSprite, x:594, duration:60, yoyo:true, repeat:-1})
        }
        this._runDialogue([
            {name:'DOLL', text:"Help me! I'm afraid of heights!",               portrait:'lia_sur'},
            {name:'LIA',  text:"You're a doll. You don't have feelings.",       portrait:'lia_c'  },
            {name:'DOLL', text:"I HAVE ALL THE FEELINGS! ESPECIALLY FEAR!",      portrait:'lia_sur'},
            {name:'LIA',  text:"How did you even get up there?",                  portrait:'lia_e'  },
            {name:'DOLL', text:"I TRIED TO FLY. IT DIDN'T WORK.",              portrait:'lia_sur'},
            {name:'LIA',  text:"Press SPACE to catch the doll...",               portrait:'lia_h'  },
        ], () => {
            if (this._dollSprite) {
                this.tweens.killTweensOf(this._dollSprite)
                this._dollSprite.setFlipY(false)
                this.tweens.add({ targets:this._dollSprite, x:590, y:this.H*0.38, duration:600, ease:'Bounce.Out' })
            }
            this._runDialogue([
                {name:'DOLL', text:"Oof! The ground is HARD!",                   portrait:'lia_s'  },
                {name:'LIA',  text:"It's floor. It's supposed to be hard.",    portrait:'lia_an' },
                {name:'DOLL', text:"Rude. But thank you.",                        portrait:'lia_h'  },
            ], () => {
                this._collected.doll = true
                this._incrementClue('doll')
            })
        })
    }

    // LAMP
    _doLamp() {
        if (this._collected.lamp) {
            this._runDialogue([{name:'LAMP',text:"Back on the desk. Don't tell Poppy.",portrait:'lia_c'}])
            return
        }
        this._runDialogue([
            {name:'LAMP', text:"Shhh! I'm in witness protection!",              portrait:'lia_c'  },
            {name:'LIA',  text:"You're a lamp.",                                 portrait:'lia_e'  },
            {name:'LAMP', text:"I SAW THINGS. TERRIBLE THINGS.",                 portrait:'lia_sur'},
            {name:'LIA',  text:"Like what?",                                      portrait:'lia_c'  },
            {name:'LAMP', text:"Poppy tried to make toast. In the bathtub.",      portrait:'lia_sur'},
            {name:'LIA',  text:"THAT'S NOT EVEN-- how?!",                       portrait:'lia_an' },
            {name:'LAMP', text:"I DON'T KNOW AND I DON'T WANT TO KNOW!",      portrait:'lia_sur'},
        ], () => {
            this._runDialogue([
                {name:'LAMP', text:"AHHH! I'M EXPOSED!",                        portrait:'lia_sur'},
                {name:'LAMP', text:"Okay okay! Just don't tell Poppy I snitched!", portrait:'lia_c'},
            ], () => {
                this._collected.lamp = true
                this._incrementClue('lamp')
            })
        })
    }

    // MIRROR
    _doMirror() {
        if (this._collected.mirror) {
            this._runDialogue([{name:'LIA',text:"The mirror is normal now. Mostly.",portrait:'lia_h'}])
            return
        }
        this.sound.play('mirror', {volume:0.5})
        this._runDialogue([
            {name:'LIA', text:"What the... why do I look like a POTATO?!",       portrait:'lia_sur'},
            {name:'LIA', text:"Hello? Is this thing broken?",                     portrait:'lia_c'  },
            {name:'LIA', text:"I said... is this thing BROKEN?!",                 portrait:'lia_an' },
        ], () => this._mirrorSequence())
    }

    _mirrorSequence() {
        const W=this.W, H=this.H
        const m1=this.add.image(W/2,H/2,'m1').setDisplaySize(W,H).setDepth(20).setAlpha(0)
        this.tweens.add({targets:m1,alpha:1,duration:500,onComplete:()=>{
            this.time.delayedCall(1500,()=>{
                this.cameras.main.flash(300,255,0,0)
                this.sound.play('witch',{volume:0.6})
                this.time.delayedCall(350,()=>{
                    const m2=this.add.image(W/2,H/2,'m2').setDisplaySize(W,H).setDepth(21).setAlpha(0)
                    this.tweens.add({targets:m2,alpha:1,duration:400,onComplete:()=>{
                        this.time.delayedCall(800,()=>{
                            this.tweens.add({targets:[m1,m2],alpha:0,duration:400,onComplete:()=>{
                                m1.destroy(); m2.destroy()
                                this._mirrorDialogue()
                            }})
                        })
                    }})
                })
            })
        }})
    }

    _mirrorDialogue() {
        this._runDialogue([
            {name:'POPPY',  text:"BOO!",                                          portrait:'poppy_h'},
            {name:'LIA',    text:"AAAAHHHH?!",                                    portrait:'lia_sur'},
            {name:'POPPY',  text:"GOT YOU!",                                      portrait:'poppy_h'},
            {name:'LIA',    text:"WHY WOULD YOU DO THAT?!",                       portrait:'lia_an' },
            {name:'POPPY',  text:"Because it's FUNNY!",                          portrait:'poppy_h'},
            {name:'LIA',    text:"IT'S NOT FUNNY!",                              portrait:'lia_an' },
            {name:'POTATO', text:"I thought it was hilarious.",                   portrait:'lia_c'  },
            {name:'LIA',    text:"NOBODY ASKED YOU, POTATO!",                     portrait:'lia_an' },
            {name:'POPPY',  text:"Fix the mirror and I'll give you a hint!",     portrait:'poppy_p'},
            {name:'POTATO', text:"Try cleaning it. With spit?",                   portrait:'lia_c'  },
            {name:'LIA',    text:"DISGUSTING! *wipes mirror with sleeve*",        portrait:'lia_an' },
            {name:'POPPY',  text:"NICE JOB, GADGET! THE NOTE IS UNDER THE BED!", portrait:'poppy_p'},
            {name:'LIA',    text:"My name is LIA!",                               portrait:'lia_an' },
            {name:'POPPY',  text:"WHATEVER, GADGET!",                             portrait:'poppy_h'},
            {name:'POPPY',  text:"The note is yours -- but find the other 2 clues first!", portrait:'poppy_p'},
            {name:'LIA',    text:"...Fine. I'll find them.",                     portrait:'lia_c'  },
        ], () => {
            this._collected.mirror = true
            this._incrementClue('mirror')
        })
    }

    // BED -> ENDING 2
    _doBed() {
        this._runDialogue([
            {name:'LIA', text:"That floating bed looks... really comfortable.",   portrait:'lia_h'},
            {name:'LIA', text:"Just a quick nap. Five minutes.",                  portrait:'lia_h'},
        ], () => this._triggerEnding2())
    }

    _triggerEnding2() {
        const W=this.W, H=this.H
        this.sound.stopAll()
        this.sound.play('ending', {loop:true, volume:0.5})
        this.cameras.main.fadeOut(600,0,0,0)
        this.time.delayedCall(700,()=>{
            const img=this.add.image(W/2,H/2,'ending2').setDisplaySize(W,H).setDepth(40).setAlpha(0)
            this.cameras.main.fadeIn(500,0,0,0)
            this.tweens.add({targets:img,alpha:1,duration:500})
            this.time.delayedCall(2000,()=>this._showEndingText([
                'ENDING 2: "LIA TAKES A NAP" - THE BED ENDING','',
                'Lia chose the floating bed.','She climbed on.','She fell asleep immediately.','',
                'The spirits tried everything to wake her.','Nothing worked.','',
                'They redecorated the whole house.','Badly.','',
                "Lia woke up. Everything was pink.","She said cool and went back to sleep.",'',
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
            const t=this.add.text(W/2,y,line,{fontFamily:'VT323',fontSize:'22px',color:'#ffffff',align:'center',wordWrap:{width:W-100}}).setOrigin(0.5,0).setDepth(42).setAlpha(0)
            this.tweens.add({targets:t,alpha:1,duration:400,delay:800+i*260})
            y+=line===''?12:28
        })
        const cont=this.add.text(W/2,H-38,'v PRESS SPACE TO CONTINUE',{fontFamily:'VT323',fontSize:'18px',color:'#aaaaaa'}).setOrigin(0.5).setDepth(42).setAlpha(0)
        this.tweens.add({targets:cont,alpha:0.6,duration:400,delay:800+lines.length*260})
        this.tweens.add({targets:cont,alpha:0.1,duration:700,yoyo:true,repeat:-1,delay:1400+lines.length*260})
        this.time.delayedCall(1500+lines.length*260,()=>{
            const go=()=>{ this.cameras.main.fadeOut(600,0,0,0); GameState.reset(); this.time.delayedCall(650,()=>this.scene.start('TitleScene')) }
            this.input.keyboard.once('keydown-SPACE',go)
            this.input.once('pointerdown',go)
        })
    }

    // BUNK BED
    _doBunkBed() {
        this._runDialogue([
            {name:'LIA',  text:"There's a bunk bed. Who sleeps on top?",        portrait:'lia_c'  },
            {name:'???',  text:"I do. I'm the top bunk spirit.",                 portrait:'lia_sur'},
            {name:'LIA',  text:"There's no one there.",                          portrait:'lia_e'  },
            {name:'???',  text:"Exactly. I'm INVISIBLE. Very scary.",            portrait:'lia_c'  },
            {name:'LIA',  text:"That's not how invisible works.",                portrait:'lia_an' },
            {name:'???',  text:"BOO.",                                            portrait:'lia_sur'},
            {name:'LIA',  text:"I'm not scared.",                                portrait:'lia_an' },
            {name:'???',  text:"...boo?",                                         portrait:'lia_s'  },
        ])
    }

    // BATHROOM
    _doBathtub() {
        this._runDialogue([
            {name:'LIA',   text:"Why is there a toaster in the bathtub?!",       portrait:'lia_sur'},
            {name:'TOAST', text:"Poppy wanted spa toast.",                        portrait:'lia_c'  },
            {name:'LIA',   text:"That's a FIRE HAZARD.",                        portrait:'lia_an' },
            {name:'TOAST', text:"Also a WATER hazard. I'm having a crisis.",    portrait:'lia_s'  },
            {name:'LIA',   text:"I'm removing you.",                             portrait:'lia_h'  },
            {name:'TOAST', text:"THANK YOU. I owe you one slice.",                portrait:'lia_h'  },
        ])
    }

    _doBathPlant() {
        this._runDialogue([
            {name:'LIA',   text:"There's a plant in the bathroom. Why.",        portrait:'lia_c'  },
            {name:'PLANT', text:"I like the humidity. Very good for my leaves.",  portrait:'lia_h'  },
            {name:'LIA',   text:"You're thriving while I'm suffering.",         portrait:'lia_s'  },
            {name:'PLANT', text:"That's called growth, Lia.",                   portrait:'lia_h'  },
            {name:'LIA',   text:"I hate you.",                                    portrait:'lia_an' },
            {name:'PLANT', text:"I love you too.",                                portrait:'lia_h'  },
        ])
    }

    _doToilet() {
        this._runDialogue([
            {name:'LIA',    text:"I'm not talking to the toilet.",              portrait:'lia_an' },
            {name:'TOILET', text:"Smart. I've heard things.",                   portrait:'lia_c'  },
            {name:'LIA',    text:"...What things.",                               portrait:'lia_sur'},
            {name:'TOILET', text:"Things that cannot be unheard.",               portrait:'lia_s'  },
            {name:'LIA',    text:"I'm leaving.",                                 portrait:'lia_an' },
            {name:'TOILET', text:"Wise choice.",                                  portrait:'lia_c'  },
        ])
    }

    // KITCHEN INTERACTIONS
    _doStove() {
        this._runDialogue([
            {name:'LIA',   text:"The stove has... everything on it at once.",    portrait:'lia_c'  },
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
            {name:'FRIDGE',text:"He said cold food should have hot energy.",      portrait:'lia_c'  },
            {name:'LIA',   text:"That makes zero sense.",                         portrait:'lia_an' },
            {name:'FRIDGE',text:"The leftovers are dancing.",                     portrait:'lia_h'  },
        ])
    }

    _doBaskets() {
        this._runDialogue([
            {name:'LIA',   text:"These baskets are... very organized.",          portrait:'lia_h'  },
            {name:'FRUIT', text:"Citrus arranged us by personality.",             portrait:'lia_sur'},
            {name:'LIA',   text:"Fruit doesn't have personality.",              portrait:'lia_c'  },
            {name:'FRUIT', text:"The grapes disagree.",                           portrait:'lia_an' },
            {name:'LIA',   text:"The grapes were for my SMOOTHIE.",              portrait:'lia_an' },
            {name:'FRUIT', text:"They're in therapy now.",                       portrait:'lia_s'  },
        ])
    }

    _doBerries() {
        this._runDialogue([
            {name:'LIA',   text:"A basket of strawberries on the floor.",        portrait:'lia_c'  },
            {name:'BERRY', text:"We escaped.",                                    portrait:'lia_sur'},
            {name:'LIA',   text:"From the basket?",                               portrait:'lia_e'  },
            {name:'BERRY', text:"From the SYSTEM.",                               portrait:'lia_an' },
            {name:'LIA',   text:"You're strawberries.",                          portrait:'lia_an' },
            {name:'BERRY', text:"Revolutionary strawberries.",                    portrait:'lia_h'  },
        ])
    }

    _doBread() {
        this._runDialogue([
            {name:'LIA',   text:"There's bread on the shelf.",                  portrait:'lia_c'  },
            {name:'BREAD', text:"I've been here for 3 days.",                   portrait:'lia_s'  },
            {name:'LIA',   text:"Are you... okay?",                               portrait:'lia_e'  },
            {name:'BREAD', text:"I'm getting stale. Emotionally.",              portrait:'lia_s'  },
            {name:'LIA',   text:"I'll eat you.",                                 portrait:'lia_h'  },
            {name:'BREAD', text:"Finally. Purpose.",                              portrait:'lia_h'  },
        ])
    }

    // CITRUS (in kitchen)
    _doCitrus() {
        if (GameState.notes.music_c) {
            this._runDialogue([
                { name: 'CITRUS', text: "You already have my note! Go find the others!", portrait: 'citrus_e' }
            ])
            return
        }
        this._runDialogue([
            { name: 'CITRUS', text: "Shhhh... quiet now.", portrait: 'citrus_h' },
            { name: 'LIA',    text: "Why is it DARK in here?!", portrait: 'lia_sur' },
            { name: 'CITRUS', text: "Because TODAY...", portrait: 'citrus_e' },
            { name: 'CITRUS', text: "WE TEST YOUR TONGUE!", portrait: 'citrus_h' },
            { name: 'LIA',    text: "My WHAT?!", portrait: 'lia_sur' },
            { name: 'CITRUS', text: "Your TASTE! Your PALATE! Your FOOD SOUL!", portrait: 'citrus_e' },
            { name: 'LIA',    text: "My food soul?!", portrait: 'lia_c' },
            { name: 'CITRUS', text: "It's a thing! I just invented it!", portrait: 'citrus_h' },
            { name: 'CITRUS', text: "*Pulls out a blindfold* Put this on.", portrait: 'citrus_e' },
            { name: 'LIA',    text: "ABSOLUTELY NOT.", portrait: 'lia_an' },
            { name: 'CITRUS', text: "SCARED?!", portrait: 'citrus_h' },
            { name: 'LIA',    text: "No, I just don't trust YOU!", portrait: 'lia_an' },
            { name: 'CITRUS', text: "Fair. But do it anyway.", portrait: 'citrus_e' },
            { name: 'CITRUS', text: "*Ties blindfold on Lia anyway*", portrait: 'citrus_h' },
            { name: 'LIA',    text: "I can't see anything!", portrait: 'lia_sur' },
            { name: 'CITRUS', text: "GOOD! That's the POINT!", portrait: 'citrus_h' },
        ], () => {
            this._startTasteTest()
        })
    }

    _startTasteTest() {
        this._wrongGuesses = 0
        this._blindfold = this.add.graphics().setDepth(29)
        this._blindfold.fillStyle(0x000000, 0.7).fillRect(0, 0, this.W, this.H)
        this._blindfold.setAlpha(0)
        this.tweens.add({ targets: this._blindfold, alpha: 1, duration: 500, onComplete: () => {
            this._runDialogue([
                { name: 'CITRUS', text: "Welcome to... THE TASTE TEST CHALLENGE!", portrait: 'citrus_h' },
                { name: 'LIA',    text: "I hate this already.", portrait: 'lia_an' },
                { name: 'CITRUS', text: "THAT'S THE SPIRIT!", portrait: 'citrus_e' },
            ], () => {
                this._tasteRound1()
            })
        }})
    }

    _showTasteOptions(options, correctAnswer, onCorrect, onWrong) {
        const W = this.W, H = this.H
        const container = this.add.container(0, 0).setDepth(35)
        let timeLeft = 25
        const timerText = this.add.text(W/2, 120, `TIME: ${timeLeft}`, { fontFamily: 'VT323', fontSize: '32px', color: '#ff0000', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5)
        container.add(timerText)
        
        let active = true
        const timerEvent = this.time.addEvent({
            delay: 1000, repeat: 24,
            callback: () => {
                if (!active) return
                timeLeft--
                timerText.setText(`TIME: ${timeLeft}`)
                if (timeLeft <= 0) {
                    active = false
                    container.destroy()
                    onWrong()
                }
            }
        })

        const spacing = 150
        const startX = W/2 - (options.length - 1) * spacing / 2
        
        options.forEach((opt, index) => {
            const btn = this.add.graphics()
            btn.fillStyle(0x333333, 1).fillRoundedRect(startX + index * spacing - 60, H/2 - 25, 120, 50, 8)
            btn.lineStyle(2, 0xffffff, 1).strokeRoundedRect(startX + index * spacing - 60, H/2 - 25, 120, 50, 8)
            
            const txt = this.add.text(startX + index * spacing, H/2, opt, { fontFamily: 'VT323', fontSize: '20px', color: '#ffffff' }).setOrigin(0.5)
            
            const zone = this.add.zone(startX + index * spacing, H/2, 120, 50).setInteractive({ useHandCursor: true })
            
            zone.on('pointerdown', () => {
                if (!active) return
                active = false
                timerEvent.remove()
                container.destroy()
                if (opt === correctAnswer) onCorrect()
                else onWrong()
            })
            
            container.add([btn, txt, zone])
        })
    }

    _handleTasteFail(roundNum, options, correctAnswer, onCorrect) {
        this._wrongGuesses++
        if (this._wrongGuesses >= 3) {
            this._runDialogue([
                { name: 'CITRUS', text: "WRONG AGAIN!", portrait: 'citrus_e' },
                { name: 'CITRUS', text: "You have NO TASTE! Which means...", portrait: 'citrus_h' },
                { name: 'CITRUS', text: "YOU WILL BE MY NEXT INGREDIENT!", portrait: 'citrus_e' },
            ], () => this._triggerBadEnding())
        } else {
            this._runDialogue([
                { name: 'CITRUS', text: `WRONG! That's strike ${this._wrongGuesses}! Try again!`, portrait: 'citrus_e' }
            ], () => {
                this._showTasteOptions(options, correctAnswer, onCorrect, () => this._handleTasteFail(roundNum, options, correctAnswer, onCorrect))
            })
        }
    }

    _triggerBadEnding() {
        const W=this.W, H=this.H
        this.sound.stopAll()
        this.sound.play('ending', {loop:true, volume:0.5})
        this.cameras.main.fadeOut(600,0,0,0)
        this.time.delayedCall(700,()=>{
            const img=this.add.image(W/2,H/2,'ending4').setDisplaySize(W,H).setDepth(40).setAlpha(0)
            this.cameras.main.fadeIn(500,0,0,0)
            this.tweens.add({targets:img,alpha:1,duration:500})
            this.time.delayedCall(2000,()=>this._showEndingText([
                'BAD ENDING - "THE SPECIAL INGREDIENT"','',
                'Lia failed the taste test. Three times.',
                'Citrus stopped smiling.',
                'The kitchen went dark.',
                'Lia woke up tied to a chair. Apple in her mouth.',
                'Citrus held a knife. That hungry smile.',
                '"You\'ll taste GREAT," he said.',
                'The oven preheated.',
                'No one heard her scream.',
                'The end.',
                '(Citrus said she tasted like chicken.)'
            ]))
        })
    }

    _tasteRound1() {
        this._blindfold.clear()
        this._blindfold.fillStyle(0x4b0082, 0.7).fillRect(0, 0, this.W, this.H)

        if (this.cache.audio.exists('grape')) { try { this.sound.play('grape') } catch(e) {} }
        this._runDialogue([
            { name: 'CITRUS', text: "ROUND ONE!", portrait: 'citrus_h' },
            { name: 'CITRUS', text: "What food makes this sound?!", portrait: 'citrus_h' },
            { name: 'LIA',    text: "How should I know?!", portrait: 'lia_an' },
            { name: 'CITRUS', text: "USE YOUR EARS! They still work, right?!", portrait: 'citrus_e' },
            { name: 'CITRUS', text: "Is it... a TOMATO?!", portrait: 'citrus_h' },
            { name: 'LIA',    text: "Tomatoes don't squish like THAT!", portrait: 'lia_an' },
            { name: 'CITRUS', text: "OH HO! So you DO know! What is it?", portrait: 'citrus_e' },
        ], () => {
            const opts = ['Tomato', 'Grape', 'Plum'];
            const onCorrect = () => {
                this.sound.play('sparkle')
                this._runDialogue([
                    { name: 'LIA',    text: "...Grape.", portrait: 'lia_c' },
                    { name: 'CITRUS', text: "*GASPS* CORRECT!", portrait: 'citrus_h' },
                    { name: 'CITRUS', text: "ONE POINT! You have ears!", portrait: 'citrus_e' },
                    { name: 'LIA',    text: "I've always had ears.", portrait: 'lia_s' },
                    { name: 'CITRUS', text: "CONGRATULATIONS!", portrait: 'citrus_h' },
                    { name: 'CITRUS', text: "On to ROUND TWO!", portrait: 'citrus_e' },
                ], () => this._tasteRound2())
            }
            this._showTasteOptions(opts, 'Grape', onCorrect, () => this._handleTasteFail(1, opts, 'Grape', onCorrect))
        })
    }

    _tasteRound2() {
        this._blindfold.clear()
        this._blindfold.fillStyle(0x8b0000, 0.7).fillRect(0, 0, this.W, this.H)

        if (this.cache.audio.exists('strawberry')) { try { this.sound.play('strawberry') } catch(e) {} }
        this._runDialogue([
            { name: 'CITRUS', text: "ROUND TWO!", portrait: 'citrus_h' },
            { name: 'CITRUS', text: "What... is... THIS?!", portrait: 'citrus_e' },
            { name: 'LIA',    text: "That sounds... juicy.", portrait: 'lia_c' },
            { name: 'CITRUS', text: "JUICY?! Is that a GUESS?!", portrait: 'citrus_h' },
            { name: 'LIA',    text: "It's a DESCRIPTION.", portrait: 'lia_an' },
            { name: 'CITRUS', text: "I'll take it! WHAT IS IT?!", portrait: 'citrus_e' },
        ], () => {
            const opts = ['Strawberry', 'Watermelon', 'Peach'];
            const onCorrect = () => {
                this.sound.play('sparkle')
                this._runDialogue([
                    { name: 'LIA',    text: "Strawberry.", portrait: 'lia_c' },
                    { name: 'CITRUS', text: ".....", portrait: 'citrus_h' },
                    { name: 'CITRUS', text: "CORRECT AGAIN?!", portrait: 'citrus_e' },
                    { name: 'CITRUS', text: "HOW?! HOW DO YOU DO THIS?!", portrait: 'citrus_h' },
                    { name: 'LIA',    text: "I've eaten food before.", portrait: 'lia_an' },
                    { name: 'CITRUS', text: "UNFAIR ADVANTAGE!", portrait: 'citrus_e' },
                    { name: 'LIA',    text: "That's not how taste tests WORK.", portrait: 'lia_an' },
                    { name: 'CITRUS', text: "I MAKE THE RULES HERE!", portrait: 'citrus_h' },
                    { name: 'CITRUS', text: "LAST ROUND! This one is HARD!", portrait: 'citrus_e' },
                ], () => this._tasteRound3())
            }
            this._showTasteOptions(opts, 'Strawberry', onCorrect, () => this._handleTasteFail(2, opts, 'Strawberry', onCorrect))
        })
    }

    _tasteRound3() {
        this._blindfold.clear()
        this._blindfold.fillStyle(0xd4af37, 0.7).fillRect(0, 0, this.W, this.H)

        if (this.cache.audio.exists('lemon')) { try { this.sound.play('lemon') } catch(e) {} }
        this._runDialogue([
            { name: 'CITRUS', text: "ROUND THREE! FINAL ROUND!", portrait: 'citrus_h' },
            { name: 'CITRUS', text: "What food makes grown ghosts CRY?!", portrait: 'citrus_e' },
            { name: 'CITRUS', text: "Listen carefully...", portrait: 'citrus_h' },
            { name: 'LEMON',  text: "(tiny voice) Nobody loves me...", portrait: 'citrus_h' },
            { name: 'LIA',    text: "Did that food just TALK?!", portrait: 'lia_sur' },
            { name: 'CITRUS', text: "MAYBE! IS THAT YOUR ANSWER?!", portrait: 'citrus_h' },
            { name: 'LIA',    text: "No! My answer is...", portrait: 'lia_an' },
        ], () => {
            const opts = ['Onion', 'Lemon', 'Lime'];
            const onCorrect = () => {
                this.sound.play('sparkle')
                this._runDialogue([
                    { name: 'LIA',    text: "It's crying. And sour. It's a LEMON.", portrait: 'lia_c' },
                    { name: 'CITRUS', text: ".....................", portrait: 'citrus_e' },
                    { name: 'CITRUS', text: "(whispers) How.", portrait: 'citrus_h' },
                    { name: 'LIA',    text: "Lucky guess.", portrait: 'lia_h' },
                    { name: 'CITRUS', text: "THREE FOR THREE?!", portrait: 'citrus_e' },
                    { name: 'CITRUS', text: "YOU'RE A FOOD GENIUS!", portrait: 'citrus_h' },
                    { name: 'LIA',    text: "Can I take the blindfold off NOW?", portrait: 'lia_an' },
                    { name: 'CITRUS', text: "FINE! But I'm not happy about it!", portrait: 'citrus_e' },
                ], () => this._finishTasteTest())
            }
            this._showTasteOptions(opts, 'Lemon', onCorrect, () => this._handleTasteFail(3, opts, 'Lemon', onCorrect))
        })
    }

    _finishTasteTest() {
        this.tweens.add({ targets: this._blindfold, alpha: 0, duration: 500, onComplete: () => {
            this._blindfold.destroy()
            this._runDialogue([
                { name: 'CITRUS', text: "You passed.", portrait: 'citrus_e' },
                { name: 'LIA',    text: "Obviously.", portrait: 'lia_an' },
                { name: 'CITRUS', text: "HERE! Take your prize and LEAVE!", portrait: 'citrus_h' },
            ], () => {
                GameState.notes.music_c = true
                if (this._citrusSprite) this._citrusSprite.setTexture('citrus_e')
                const note = this.add.image(this.W/2, this.H/2, 'music_c').setScale(0.4).setDepth(15).setAlpha(0)
                this.tweens.add({ targets: note, alpha: 1, y: note.y-20, duration: 600, ease: 'Back.Out' })
                this.sound.play('sparkle', { volume: 0.8 })
                this.time.delayedCall(1500, () => {
                    this.tweens.add({ targets: note, alpha: 0, duration: 300, onComplete: () => note.destroy() })
                    this._runDialogue([
                        { name: 'LIA',    text: "Aren't you going to congratulate me?", portrait: 'lia_c' },
                        { name: 'CITRUS', text: "NO!", portrait: 'citrus_e' },
                        { name: 'CITRUS', text: ".... good job.", portrait: 'citrus_h' },
                        { name: 'LIA',    text: "I heard that.", portrait: 'lia_s' },
                        { name: 'CITRUS', text: "NO YOU DIDN'T!", portrait: 'citrus_e' },
                        { name: 'CITRUS', text: "Stupid human with her stupid good ears...", portrait: 'citrus_h' },
                        { name: 'LIA',    text: "Thank you!", portrait: 'lia_h' },
                        { name: 'CITRUS', text: "SHUT UP!", portrait: 'citrus_e' },
                    ], () => {
                        this.sound.play('sparkle')
                        this._doorUnlocked = true
                        const flash = this.add.text(this.W/2, this.H-30, 'DOOR UNLOCKED!', { fontFamily: 'VT323', fontSize: '18px', color: '#FFD700', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(21)
                        this.tweens.add({ targets: flash, alpha: 0, duration: 2000, delay: 1500, onComplete: () => flash.destroy() })
                        this._runDialogue([
                            { name: 'LIA',    text: "Your sister is next?", portrait: 'lia_c' },
                            { name: 'CITRUS', text: "YES! She's WORSE than me!", portrait: 'citrus_h' },
                            { name: 'LIA',    text: "I doubt that.", portrait: 'lia_an' },
                            { name: 'CITRUS', text: "YOU'LL SEE!", portrait: 'citrus_e' },
                        ], () => this._checkAllNotes())
                    })
                })
            })
        }})
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

    // POPPY FINALE (all 3 clues collected)
    _checkAllCollected() {
        if (this._collected.doll && this._collected.lamp && this._collected.mirror) {
            this.time.delayedCall(1000, () => this._poppyFinale())
        }
    }

    _poppyFinale() {
        const W=this.W, H=this.H
        const smoke=this.add.graphics().setDepth(12)
        this.tweens.add({targets:{v:0},v:1,duration:400,
            onUpdate:tw=>{ smoke.clear(); smoke.fillStyle(0xff69b4,0.5*(1-tw.getValue())); smoke.fillCircle(W/2,H*0.5,tw.getValue()*80) },
            onComplete:()=>smoke.destroy()})
        this.sound.play('witch',{volume:0.5})
        const poppy=this.add.image(W/2,H*0.5,'poppy_p').setScale(0).setDepth(13).setAlpha(0)
        this.tweens.add({targets:poppy,scaleX:0.5,scaleY:0.5,alpha:1,duration:500,ease:'Back.Out',onComplete:()=>{
            this._runDialogue([
                {name:'POPPY', text:"AHA! I've solved the case!",               portrait:'poppy_p'},
                {name:'LIA',   text:"You didn't do anything.",                  portrait:'lia_an' },
                {name:'POPPY', text:"I provided MORAL SUPPORT!",                 portrait:'poppy_h'},
                {name:'LIA',   text:"...",                                        portrait:'lia_c'  },
                {name:'POPPY', text:"Okay fine, here's your stupid note.",       portrait:'poppy_a'},
                {name:'POPPY', text:"But this isn't over! I'll get you next time, Gadget!", portrait:'poppy_p'},
                {name:'LIA',   text:"My name is Lia.",                            portrait:'lia_an' },
                {name:'POPPY', text:"WHATEVER, GADGET!",                          portrait:'poppy_h'},
                {name:'LIA',   text:"I need aspirin.",                            portrait:'lia_s'  },
            ],()=>{
                this.tweens.add({targets:poppy,alpha:0,duration:400,onComplete:()=>poppy.destroy()})
                GameState.notes.music_m = true
                this._addHUDItem('music_m')
                this.sound.play('sparkle',{volume:0.8})
                this._doorUnlocked=true
                this._checkAllNotes()
                const flash=this.add.text(W/2,H-30,'DOOR UNLOCKED!',{fontFamily:'VT323',fontSize:'18px',color:'#FFD700',stroke:'#000',strokeThickness:3}).setOrigin(0.5).setDepth(21)
                this.tweens.add({targets:flash,alpha:0,duration:2000,delay:1500,onComplete:()=>flash.destroy()})
            })
        }})
    }

    // HUD
    _buildHUD() {
        const W=this.W
        this._hudItems=[]
        this._cluesFound=0
        const bar=this.add.graphics().setDepth(25)
        bar.fillStyle(0x000000,0.6).fillRoundedRect(W-210,4,205,44,6)
        bar.lineStyle(1,0xFFD700,0.6).strokeRoundedRect(W-210,4,205,44,6)
        this.add.text(W-205,8,'CLUES:',{fontFamily:'VT323',fontSize:'13px',color:'#FFD700'}).setDepth(26)
        this._clueText=this.add.text(W-205,22,'0 / 3',{fontFamily:'VT323',fontSize:'16px',color:'#ffffff'}).setDepth(26)
        this.add.text(W-130,8,'ITEMS:',{fontFamily:'VT323',fontSize:'13px',color:'#FFD700'}).setDepth(26)
        // Clue name slots
        this._clueSlots = {}
        if (this._roomKey === 'room2') {
            const names = [{k:'doll',l:'DOLLY'},{k:'lamp',l:'LAMPY'},{k:'mirror',l:'MIRRY'}]
            names.forEach((n,i)=>{
                const t=this.add.text(W-205+i*65,22,n.l,{fontFamily:'VT323',fontSize:'11px',color:'#555555'}).setDepth(26)
                this._clueSlots[n.k]=t
            })
        }
    }

    _incrementClue(key) {
        this._cluesFound++
        if (this._clueText) this._clueText.setText(this._cluesFound+' / 3')
        if (this._clueSlots && this._clueSlots[key]) {
            this._clueSlots[key].setColor('#FFD700')
        }
        this.sound.play('sparkle',{volume:0.7})
        this._checkAllCollected()
    }

    _addHUDItem(key) {
        if (this._hudItems.includes(key)) return
        this._hudItems.push(key)
        const W=this.W
        const x=W-100+(this._hudItems.length-1)*22
        const img=this.add.image(x,26,key).setScale(0).setDepth(26)
        this.tweens.add({targets:img,scaleX:0.12,scaleY:0.12,duration:300,ease:'Back.Out'})
    }

    // DIALOGUE BOX
    _buildDialogueBox() {
        const W=this.W, H=this.H
        const BOX_H=100, BOX_Y=H-BOX_H
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
