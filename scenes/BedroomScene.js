import { GameState } from './GameState.js'
import Phaser from 'phaser'
export default class BedroomScene extends Phaser.Scene {
    constructor() { super('BedroomScene') }

    preload() {
        this.load.image('room1',    'rooms/room1.png')
        this.load.image('ending1',  'ending1.png')
        this.load.spritesheet('lia_sheet', 'sprites/lia.png', {
            frameWidth: 32,
            frameHeight: 64
        })
        ;['lia_stand','lia_an','lia_e','lia_sur','lia_s','lia_c','lia_h'].forEach(k =>
            this.load.image(k, 'sprites/'+k+'.png'))
        ;['poppy_a','poppy_e','poppy_h','poppy_p',
          'citrus_a','citrus_e','citrus_h','citrus_p',
          'melody_a','melody_e','melody_h','melody_p'].forEach(k =>
            this.load.image(k, 'spirits/'+k+'.png'))
        this.load.audio('witch',  'music/witch.mp3')
        this.load.audio('witch1', 'music/witch1.mp3')
        this.load.audio('glitch',   'music/glitch.mp3')
        this.load.audio('overall',  'music/overall.mp3')
        this.load.audio('door',     'music/door_creak.mp3')
        this.load.audio('ending',   'music/ending.mp3')
    }

    create() {
        const W = this.scale.width, H = this.scale.height
        this.W = W; this.H = H
        this._witchIdx   = 0
        this._dlgQueue   = []
        this._dlgActive  = false
        this._transitioning = false
        this._whaaatLetters = []
        this._whaaatTimers  = []

        if (!this.anims.exists('lia_walk_down')) {
            this.anims.create({key:'lia_idle',       frames:this.anims.generateFrameNumbers('lia_sheet',{start:2, end:3}),  frameRate:2, repeat:-1})
            this.anims.create({key:'lia_walk_down',  frames:this.anims.generateFrameNumbers('lia_sheet',{start:0, end:5}),  frameRate:8, repeat:-1})
            this.anims.create({key:'lia_walk_left',  frames:this.anims.generateFrameNumbers('lia_sheet',{start:6, end:11}), frameRate:8, repeat:-1})
            this.anims.create({key:'lia_walk_right', frames:this.anims.generateFrameNumbers('lia_sheet',{start:12,end:17}), frameRate:8, repeat:-1})
            this.anims.create({key:'lia_walk_up',    frames:this.anims.generateFrameNumbers('lia_sheet',{start:18,end:23}), frameRate:8, repeat:-1})
        }
        this.cursors = this.input.keyboard.createCursorKeys()

        
        if (!this.sound.get('overall') || !this.sound.get('overall').isPlaying) {
            this.sound.play('overall', {loop:true, volume:0.4})
        }
        this._buildRoom()
        this._buildCollisions()
        this._buildInteractables()
        this._buildDialogueBox()

        
        if (!GameState.introDone) {
            this.time.delayedCall(500,  ()=>this._showWhaaat())
            this.time.delayedCall(4000, ()=>this._spiritEntrances())
        } else {
            
            this.liaSprite.setAlpha(1)
            this.liaSprite.play('lia_idle')
        }
    }

    _buildRoom() {
        const W=this.W, H=this.H
        this.add.image(W/2, H/2, 'room1').setDisplaySize(W, H).setDepth(0)

        const doors = this.add.graphics().setDepth(1)
        doors.fillStyle(0x00ff88, 0.15)
        doors.fillRect(30, H-80, 130, 75)
        doors.lineStyle(2, 0x00ff88, 0.6)
        doors.strokeRect(30, H-80, 130, 75)
        doors.fillStyle(0xffdd00, 0.15)
        doors.fillRect(W-160, H-80, 130, 75)
        doors.lineStyle(2, 0xffdd00, 0.6)
        doors.strokeRect(W-160, H-80, 130, 75)

        this.liaSprite = this.add.sprite(W/2, H-95, 'lia_sheet', 2)
            .setScale(1.8).setDepth(6).setAlpha(0)
        this.liaSprite.play('lia_idle')
        this._liaSpeed = 160
    }

    _buildCollisions() {
        const W=this.W, H=this.H
        this._collisionRects = [
            {x:0,    y:0,   w:W,  h:45}, 
            {x:0,    y:0,   w:28, h:H},    
            {x:W-28, y:0,   w:28, h:H},    
            {x:28,   y:45,  w:W-56, h:160},
        ]
    }

    _collidesWithWall(nx, ny) {
        const hw = 10, hh = 8
        for (const r of this._collisionRects) {
            if (nx+hw > r.x && nx-hw < r.x+r.w &&
                ny+hh > r.y && ny-hh < r.y+r.h) return true
        }
        return false
    }

    _buildInteractables() {
        const W=this.W, H=this.H
        this._interactables = [
            {
                x:95, y:H*0.42, r:65,
                lines:[
                    {name:'LIA',   text:"Hey little guy, you doing okay?",                    portrait:'lia_h'  },
                    {name:'???',   text:"I haven't been watered in 3 weeks.",                  portrait:'lia_c'  },
                    {name:'LIA',   text:"...I watered you yesterday.",                         portrait:'lia_sur'},
                    {name:'???',   text:"Emotionally. You haven't watered me emotionally.",    portrait:'lia_e'  },
                    {name:'LIA',   text:"You're a PLANT.",                                     portrait:'lia_an' },
                    {name:'???',   text:"And you're in denial.",                               portrait:'lia_s'  },
                ]
            },
            {
                x:W/2, y:H*0.28, r:80,
                isTV: true,
                lines:[
                    {name:'LIA',  text:"Let me just watch something normal for once.",        portrait:'lia_h'  },
                    {name:'TV',   text:"BREAKING NEWS: Local girl's house haunted by food spirits.", portrait:'lia_sur'},
                    {name:'LIA',  text:"HOW DO YOU KNOW ABOUT THAT?!",                        portrait:'lia_an' },
                    {name:'TV',   text:"We have sources. Also Citrus called us.",              portrait:'lia_e'  },
                    {name:'LIA',  text:"I'm unplugging you.",                                  portrait:'lia_an' },
                    {name:'TV',   text:"You can't unplug the truth, Lia.",                     portrait:'lia_c'  },
                    {name:'TV',   text:"...Also there's cake in the kitchen.",                 portrait:'lia_h'  },
                    {name:'LIA',  text:"...cake?",                                             portrait:'lia_sur'},
                ]
            },
            {
                x:W-90, y:H*0.72, r:65,
                lines:[
                    {name:'LIA',  text:"Why is there a photo next to this lamp?",             portrait:'lia_c'  },
                    {name:'LAMP', text:"That's my family portrait.",                           portrait:'lia_sur'},
                    {name:'LIA',  text:"...It's a potato.",                                    portrait:'lia_e'  },
                    {name:'LAMP', text:"We don't talk about it.",                              portrait:'lia_s'  },
                    {name:'LIA',  text:"Fair enough.",                                         portrait:'lia_h'  },
                ]
            },
            {
                x:W/2, y:H*0.65, r:70,
                lines:[
                    {name:'LIA',   text:"Is that... a cake? On the coffee table?",            portrait:'lia_sur'},
                    {name:'POPPY', text:"We found it. It's evidence.",                         portrait:'poppy_a'},
                    {name:'LIA',   text:"Evidence of WHAT?",                                   portrait:'lia_an' },
                    {name:'CITRUS',text:"That you have good taste. Unlike your smoothie choices.", portrait:'citrus_e'},
                    {name:'LIA',   text:"Those grapes were FINE.",                             portrait:'lia_an' },
                    {name:'MELODY',text:"The cake disagrees.",                                 portrait:'melody_e'},
                ]
            },
            {
                x:W-90, y:H*0.38, r:65,
                lines:[
                    {name:'LIA',   text:"Okay who put a plant in the corner?",                portrait:'lia_c'  },
                    {name:'CITRUS',text:"It brings good energy to the room.",                  portrait:'citrus_h'},
                    {name:'LIA',   text:"This is MY room.",                                    portrait:'lia_an' },
                    {name:'CITRUS',text:"And now it has good energy.",                         portrait:'citrus_e'},
                    {name:'LIA',   text:"I— fine. Fine.",                                      portrait:'lia_s'  },
                ]
            },
        ]

        this._eHint = this.add.text(0, -100, '[E] TALK', {
            fontFamily:'VT323', fontSize:'14px', color:'#ffffff',
            stroke:'#000', strokeThickness:3
        }).setOrigin(0.5).setDepth(10).setAlpha(0)

        this.input.keyboard.on('keydown-E', ()=>this._tryInteract())
    }

    _tryInteract() {
        if (this._dlgActive || !this.liaSprite || this.liaSprite.alpha < 0.5) return
        const lx=this.liaSprite.x, ly=this.liaSprite.y
        for (const obj of this._interactables) {
            if (Phaser.Math.Distance.Between(lx,ly,obj.x,obj.y) < obj.r) {
                if (obj.isTV) {
                    this._startObjectDialogue(obj.lines, true)
                } else {
                    this._startObjectDialogue(obj.lines, false)
                }
                return
            }
        }
    }


    update() {
        if (!this.liaSprite || this.liaSprite.alpha < 0.5) return

        if (this._interactables && !this._dlgActive) {
            let nearest = null, nearDist = 9999
            this._interactables.forEach(obj => {
                const d = Phaser.Math.Distance.Between(this.liaSprite.x, this.liaSprite.y, obj.x, obj.y)
                if (d < obj.r && d < nearDist) { nearest=obj; nearDist=d }
            })
            if (nearest) {
                this._eHint.setPosition(nearest.x, nearest.y-50).setAlpha(0.9)
            } else {
                this._eHint.setAlpha(0)
            }
        } else {
            if (this._eHint) this._eHint.setAlpha(0)
        }

        if (this._dlgActive || this._transitioning) return

        const spd=this._liaSpeed, W=this.W, H=this.H
        let vx=0, vy=0

        if      (this.cursors.left.isDown)  { vx=-spd; if (this.liaSprite.anims.currentAnim?.key!=='lia_walk_left')  this.liaSprite.play('lia_walk_left')  }
        else if (this.cursors.right.isDown) { vx= spd; if (this.liaSprite.anims.currentAnim?.key!=='lia_walk_right') this.liaSprite.play('lia_walk_right') }
        else if (this.cursors.up.isDown)    { vy=-spd; if (this.liaSprite.anims.currentAnim?.key!=='lia_walk_up')    this.liaSprite.play('lia_walk_up')    }
        else if (this.cursors.down.isDown)  { vy= spd; if (this.liaSprite.anims.currentAnim?.key!=='lia_walk_down')  this.liaSprite.play('lia_walk_down')  }
        else { if (this.liaSprite.anims.currentAnim?.key!=='lia_idle') this.liaSprite.play('lia_idle') }

        const dt = 1/60
        const nx = this.liaSprite.x + vx*dt
        const ny = this.liaSprite.y + vy*dt

        const cx = this._collidesWithWall(nx, this.liaSprite.y)
        const cy = this._collidesWithWall(this.liaSprite.x, ny)
        if (!cx) this.liaSprite.setX(Phaser.Math.Clamp(nx, 40, W-40))
        if (!cy) this.liaSprite.setY(Phaser.Math.Clamp(ny, 40, H-40))

        const lx=this.liaSprite.x, ly=this.liaSprite.y
        if (lx > 30 && lx < 160 && ly > H-100) {
            this._transitioning=true
            this.liaSprite.play('lia_walk_down')
            this.sound.play('door', {volume:0.7})
            this.sound.stopByKey('overall')
            this.cameras.main.fadeOut(400,0,0,0)
            this.time.delayedCall(420, ()=>this.scene.start('RoomScene', {room:'room2', returnScene:'BedroomScene'}))
        }
        if (lx > W-160 && lx < W-30 && ly > H-100) {
            this._transitioning=true
            this.liaSprite.play('lia_walk_down')
            this.sound.play('door', {volume:0.7})
            this.cameras.main.fadeOut(400,0,0,0)
            this.time.delayedCall(420, ()=>this.scene.start('RoomScene', {room:'room3', returnScene:'BedroomScene'}))
        }
    }

    _showWhaaat() {
        const W=this.W, H=this.H
        const word='WHAAAAT?!'
        const startX=W/2-(word.length*38)/2
        this._whaaatLetters=[]; this._whaaatTimers=[]
        word.split('').forEach((ch,i)=>{
            this.time.delayedCall(i*65,()=>{
                const t=this.add.text(startX+i*38,H/2-28,ch,{
                    fontFamily:'VT323',fontSize:'64px',color:'#ff2222',stroke:'#000',strokeThickness:5
                }).setDepth(15).setAlpha(0)
                this.tweens.add({targets:t,alpha:1,duration:45})
                this.tweens.add({targets:t,x:startX+i*38+Phaser.Math.Between(-3,3),y:H/2-28+Phaser.Math.Between(-3,3),duration:75,yoyo:true,repeat:-1})
                const timer=this.time.addEvent({delay:120,loop:true,callback:()=>{ if(t&&t.active) t.setColor(Math.random()>0.85?'#ff00ff':'#ff2222') }})
                this._whaaatTimers.push(timer)
                this._whaaatLetters.push(t)
            })
        })
    }

    _clearWhaaat() {
        if (this._whaaatTimers) { this._whaaatTimers.forEach(t=>{ if(t) t.remove(false) }); this._whaaatTimers=[] }
        if (this._whaaatLetters) {
            this._whaaatLetters.forEach(t=>{ if(!t||!t.active) return; this.tweens.killTweensOf(t); this.tweens.add({targets:t,alpha:0,duration:300,onComplete:()=>{ if(t&&t.active) t.destroy() }}) })
            this._whaaatLetters=[]
        }
    }

    _spiritEntrances() {
        const W=this.W, H=this.H
        this._clearWhaaat()
        const positions=Phaser.Utils.Array.Shuffle([
            {x:Phaser.Math.Between(80,W*0.32),   y:Phaser.Math.Between(H*0.2,H*0.45)},
            {x:Phaser.Math.Between(W*0.38,W*0.62),y:Phaser.Math.Between(H*0.15,H*0.4)},
            {x:Phaser.Math.Between(W*0.68,W-80),  y:Phaser.Math.Between(H*0.2,H*0.45)}
        ])
        const [pPos,cPos,mPos]=positions
        this.time.delayedCall(0,    ()=>this._smokeEffect(pPos.x,pPos.y,0xff69b4))
        this.time.delayedCall(500,  ()=>this._spawnSpirit('poppy', pPos.x,pPos.y,'poppy_a'))
        this.time.delayedCall(1500, ()=>this._smokeEffect(cPos.x,cPos.y,0xff8c00))
        this.time.delayedCall(2000, ()=>this._spawnSpirit('citrus',cPos.x,cPos.y,'citrus_e'))
        this.time.delayedCall(3000, ()=>this._smokeEffect(mPos.x,mPos.y,0x9b59b6))
        this.time.delayedCall(3500, ()=>this._spawnSpirit('melody',mPos.x,mPos.y,'melody_e'))
        this.time.delayedCall(4500, ()=>this._showLia())
        this.time.delayedCall(5500, ()=>this._startDialogue())
    }

    _smokeEffect(x,y,color) {
        const g=this.add.graphics().setDepth(8)
        this.tweens.add({targets:{v:0},v:1,duration:380,
            onUpdate:tw=>{ g.clear(); g.fillStyle(color,0.55*(1-tw.getValue())); g.fillCircle(x,y,tw.getValue()*90) },
            onComplete:()=>g.destroy()})
        this.sound.play(this._witchIdx%2===0?'witch':'witch1',{volume:0.4})
        this._witchIdx++
    }

    _spawnSpirit(ref,x,y,key) {
        const img=this.add.image(x,y+28,key).setScale(0).setDepth(9).setAlpha(0)
        this[ref+'Sprite']=img
        this.tweens.add({targets:img,scaleX:0.45,scaleY:0.45,alpha:1,y,duration:480,ease:'Back.Out'})
    }

    _showLia() { this.tweens.add({targets:this.liaSprite,alpha:1,duration:380}) }

    _spiritsLeave() {
        ;['poppySprite','citrusSprite','melodySprite'].forEach(ref=>{
            if (!this[ref]) return
            this.tweens.add({
                targets:this[ref], y:this[ref].y+40, alpha:0, duration:600, ease:'Sine.In',
                onComplete:()=>{ if(this[ref]) this[ref].destroy(); this[ref]=null }
            })
        })
    }

    _triggerEnding() {
        const W=this.W, H=this.H
        this._dlgActive=false
        GameState.reset()
        this.sound.stopAll()
        this.sound.play('ending', {loop:true, volume:0.5})
        this.tweens.add({targets:this.dlgContainer,alpha:0,duration:200})
        this.tweens.add({targets:this.dlgPortrait,alpha:0,duration:200})

        this.sound.stopAll()
        this.sound.play('ending', {loop:true, volume:0.5})
        this.cameras.main.fadeOut(600,0,0,0)
        this.time.delayedCall(700,()=>{
            const endImg=this.add.image(W/2,H/2,'ending1').setDisplaySize(W,H).setDepth(40).setAlpha(0)
            this.cameras.main.fadeIn(500,0,0,0)
            this.tweens.add({targets:endImg,alpha:1,duration:500})

            this.time.delayedCall(2000,()=>this._showEndingText(endImg))
        })
    }

    _showEndingText(endImg) {
        const W=this.W, H=this.H
        const lines=[
            'ENDING 1: "LIA GIVES UP" - THE CAKE ENDING',
            '',
            'Lia chose cake over chaos.',
            'The spirits watched her eat the whole thing.',
            "They couldn't have any.",
            'Ghost hands go through cake.',
            'Very unfair.',
            '',
            'Lia took a nap on the floating bed.',
            'The spirits cried.',
            "She didn't care.",
            '',
            'The end.',
        ]

        const overlay=this.add.graphics().setDepth(41)
        overlay.fillStyle(0x000000,0.72).fillRect(0,0,W,H)
        overlay.setAlpha(0)
        this.tweens.add({targets:overlay,alpha:1,duration:600})

        const title=this.add.text(W/2,60,lines[0],{
            fontFamily:'VT323',fontSize:'28px',color:'#FFD700',
            stroke:'#000',strokeThickness:4,align:'center',wordWrap:{width:W-80}
        }).setOrigin(0.5,0).setDepth(42).setAlpha(0)
        this.tweens.add({targets:title,alpha:1,duration:500,delay:400})

        let y=120
        lines.slice(1).forEach((line,i)=>{
            const t=this.add.text(W/2,y,line,{
                fontFamily:'VT323',fontSize:'22px',color:'#ffffff',
                align:'center',wordWrap:{width:W-100}
            }).setOrigin(0.5,0).setDepth(42).setAlpha(0)
            this.tweens.add({targets:t,alpha:1,duration:400,delay:800+i*280})
            y+=line===''?14:28
        })

        const cont=this.add.text(W/2,H-40,'▼ PRESS SPACE TO CONTINUE',{
            fontFamily:'VT323',fontSize:'20px',color:'#aaaaaa'
        }).setOrigin(0.5).setDepth(42).setAlpha(0)
        this.tweens.add({targets:cont,alpha:0.6,duration:400,delay:800+lines.length*280})
        this.tweens.add({targets:cont,alpha:0.1,duration:700,yoyo:true,repeat:-1,delay:1200+lines.length*280})

        const goHome=()=>{
            this.cameras.main.fadeOut(600,0,0,0)
            GameState.reset(); this.time.delayedCall(650,()=>this.scene.start('TitleScene'))
        }
        this.time.delayedCall(1500+lines.length*280,()=>{
            this.input.keyboard.once('keydown-SPACE',goHome)
            this.input.once('pointerdown',goHome)
        })
    }


    _buildDialogueBox() {
        const W=this.W,H=this.H,BOX_H=110,BOX_Y=H-BOX_H
        this.dlgContainer=this.add.container(0,0).setDepth(30).setAlpha(0)
        const bg=this.add.graphics()
        bg.fillStyle(0x000000,0.72).fillRoundedRect(0,BOX_Y,W,BOX_H,8)
        bg.lineStyle(3,0xffffff,1).strokeRoundedRect(0,BOX_Y,W,BOX_H,8)
        bg.fillStyle(0x333333,1).fillRect(0,BOX_Y,2,BOX_H)
        bg.fillStyle(0x333333,1).fillRect(0,BOX_Y,W,2)
        const nameBox=this.add.graphics()
        nameBox.fillStyle(0x000080,1).fillRoundedRect(8,BOX_Y+8,180,70,4)
        nameBox.lineStyle(2,0xFFD700,1).strokeRoundedRect(8,BOX_Y+8,180,70,4)
        nameBox.fillStyle(0xFFD700,1)
        nameBox.fillTriangle(98,BOX_Y+6,88,BOX_Y+16,108,BOX_Y+16)
        const textBg=this.add.graphics()
        textBg.fillStyle(0x1a1a1a,1).fillRoundedRect(198,BOX_Y+8,W-208,70,4)
        const ps=this.add.text(W-8,H-8,'▼ PRESS SPACE',{fontFamily:'VT323',fontSize:'17px',color:'#ffffff'}).setOrigin(1,1)
        this.tweens.add({targets:ps,alpha:0.15,duration:480,yoyo:true,repeat:-1})
        this.dlgNameText=this.add.text(98,BOX_Y+43,'',{fontFamily:'VT323',fontSize:'20px',color:'#FFD700'}).setOrigin(0.5)
        this.dlgBodyText=this.add.text(208,BOX_Y+16,'',{fontFamily:'VT323',fontSize:'24px',color:'#ffffff',wordWrap:{width:W-228},lineSpacing:3})
        // Portrait sits above the name box — starts fully hidden
        this.dlgPortrait=this.add.image(98,BOX_Y-42,'lia_stand').setScale(0.35).setDepth(31).setAlpha(0).setVisible(false)
        this.dlgContainer.add([bg,nameBox,textBg,ps,this.dlgNameText,this.dlgBodyText])
        this.input.keyboard.on('keydown-SPACE',()=>this._advanceDialogue())
        this.input.on('pointerdown',()=>this._advanceDialogue())
    }

    _startDialogue() {
        this._isMainDlg=true
        this._dlgQueue=[
            {name:'POPPY',  text:"Oh. You're home early.",                                                        portrait:'poppy_a' },
            {name:'LIA',    text:"It's 8 PM! This is MY house!",                                                  portrait:'lia_an'  },
            {name:'CITRUS', text:'Your grapes are delicious, by the way.',                                        portrait:'citrus_e'},
            {name:'LIA',    text:'THOSE WERE FOR MY SMOOTHIE!',                                                   portrait:'lia_an'  },
            {name:'MELODY', text:"We're bored. Entertain us.",                                                    portrait:'melody_e'},
            {name:'LIA',    text:'OR YOU COULD LEAVE?!',                                                          portrait:'lia_sur' },
            {name:'POPPY',  text:"Nah. Find our 3 lost brain cells—I mean, MUSIC NOTES—and we'll fix your house.",portrait:'poppy_p' },
            {name:'LIA',    text:'Brain cells? That explains a LOT.',                                              portrait:'lia_c'   },
            {name:'CITRUS', text:"Good luck! You'll need it because we're IDIOTS!",                               portrait:'citrus_a'},
        ]
        this._dlgIndex=0
        this._showNextLine()
        GameState.introDone = true
    }

    _startObjectDialogue(lines, isTV=false) {
        this._isMainDlg=false
        this._isTVDlg=isTV
        this._dlgQueue=lines
        this._dlgIndex=0
        this._showNextLine()
    }

    _showNextLine() {
        if (this._dlgIndex>=this._dlgQueue.length) { this._closeDialogue(); return }
        const line=this._dlgQueue[this._dlgIndex]
        this._dlgActive=true
        this.tweens.add({targets:this.dlgContainer,alpha:1,duration:180})
        this.dlgNameText.setText(line.name)
        this.dlgBodyText.setText('')
        if (this.textures.exists(line.portrait)) this.dlgPortrait.setTexture(line.portrait)
        this.dlgPortrait.setVisible(true)
        this.tweens.add({targets:this.dlgPortrait,alpha:1,duration:180})
        const fullText=line.text
        let charIdx=0
        this._typeTimer=this.time.addEvent({delay:36,repeat:fullText.length-1,
            callback:()=>{ charIdx++; this.dlgBodyText.setText(fullText.substring(0,charIdx)) }})
        this._highlightSpeaker(line.name,line.portrait)
    }

    _highlightSpeaker(name,portrait) {
        const all=['poppySprite','citrusSprite','melodySprite']
        all.forEach(ref=>{ if(this[ref]) this.tweens.add({targets:this[ref],alpha:0.35,duration:180}) })
        if (name==='POPPY'  && this.poppySprite)  { this.tweens.add({targets:this.poppySprite, alpha:1,duration:180}); this.poppySprite.setTexture(portrait)  }
        if (name==='CITRUS' && this.citrusSprite) { this.tweens.add({targets:this.citrusSprite,alpha:1,duration:180}); this.citrusSprite.setTexture(portrait) }
        if (name==='MELODY' && this.melodySprite) { this.tweens.add({targets:this.melodySprite,alpha:1,duration:180}); this.melodySprite.setTexture(portrait) }
        if (name==='LIA'||name==='TV'||name==='LAMP'||name==='???') {
            all.forEach(ref=>{ if(this[ref]) this.tweens.add({targets:this[ref],alpha:0.35,duration:180}) })
            if (this.liaSprite) this.tweens.add({targets:this.liaSprite,alpha:1,duration:180})
        }
    }

    _advanceDialogue() {
        if (!this._dlgActive) return
        if (this._typeTimer && this._typeTimer.getRepeatCount()>0) {
            this._typeTimer.remove()
            this.dlgBodyText.setText(this._dlgQueue[this._dlgIndex].text)
            return
        }
        this._dlgIndex++
        this._showNextLine()
    }

    _closeDialogue() {
        this._dlgActive=false
        this.tweens.add({targets:this.dlgContainer,alpha:0,duration:280})
        this.tweens.add({targets:this.dlgPortrait,alpha:0,duration:280,onComplete:()=>this.dlgPortrait.setVisible(false)})
        ;['poppySprite','citrusSprite','melodySprite','liaSprite'].forEach(ref=>{
            if(this[ref]) this.tweens.add({targets:this[ref],alpha:1,duration:280})
        })
        if (this.liaSprite) this.liaSprite.play('lia_idle')

        if (this._isMainDlg) {
            this._isMainDlg=false
            this.time.delayedCall(800, ()=>this._spiritsLeave())
        }

        if (this._isTVDlg) {
            this._isTVDlg=false
            this.time.delayedCall(500, ()=>this._triggerEnding())
        }
    }
}
