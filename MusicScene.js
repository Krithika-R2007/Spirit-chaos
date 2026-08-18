import Phaser from 'phaser'
export default class IntroScene extends Phaser.Scene {
    constructor() { super('IntroScene') }

    preload() {
        this.load.image('introBg',  'intro.png')
        this.load.image('intro1Bg', 'intro1.png')
    }

    create() {
        const W = this.scale.width, H = this.scale.height

        this._bg1 = this.add.image(W/2, H/2, 'introBg').setDisplaySize(W, H).setDepth(0)
        this._bg2 = this.add.image(W/2, H/2, 'intro1Bg').setDisplaySize(W, H).setDepth(0).setAlpha(0)

        this.time.delayedCall(5000, () => {
            this.tweens.add({
                targets: this._bg1, alpha: 0, duration: 800,
                onComplete: () => {
                    this.tweens.add({
                        targets: this._bg2, alpha: 1, duration: 800,
                        onComplete: () => {
                            this.time.delayedCall(600, () => this.scene.start('TitleScene'))
                        }
                    })
                }
            })
        })
    }
}
