const { Telegraf } = require('telegraf')
const { Markup, Extra } = Telegraf

const wiki = require('wikijs').default
const dotenv = require('dotenv')

dotenv.config()

const bot = new Telegraf(process.env.TELEGRAM_API)

bot.start(ctx => {
    ctx.telegram.sendMessage(ctx.chat.id, 'Bot launch', {
        "reply_markup": {
            "keyboard":     [["Get random Wiki article"]],
            "parse_mode":   "HTML" 
            }
    })
})

bot.on('message', (ctx) => {     
    const keyboard = []
    if (ctx.message.text === 'Get random Wiki article') {
        wiki()
            .random(3)
            .then(data => {
                data.forEach(article => {
                    keyboard.push([article])
                })

                keyboard.push(["Get random Wiki article"])
                console.log(keyboard)

                ctx.telegram.sendMessage(ctx.chat.id, '...', {
                    "reply_markup": {
                        "keyboard": keyboard
                        }
                })
            })
    }

    if (ctx.message.text !== 'Get random Wiki article') {
        
        let inlineMessageRatingKeyboard

        wiki()
        .page(ctx.message.text)
        .then(data => {
            return Promise.all([data.images(), new Promise((res) => res(data.raw)), data.summary()])
        })
        .then(response => {
            const imgs = response[0]
            const data = response[1]
            const summary = response[2]

            function isJPG(val) {return val.substr(-3) === 'jpg'}
            const img = imgs.find(isJPG)

            console.log(img)
            console.log(summary)
            
            inlineMessageRatingKeyboard = Markup.inlineKeyboard([
                Markup.urlButton('🔍 Link', data.fullurl),
            ])

            console.log(data.title)
            let caption = '<b>' + data.title + '</b>' + '\n \n' + summary

            if (caption.length > 1024) {
                caption = caption.substr(0, 1000) + '...'
            }
            
            if (img) {
                ctx.replyWithPhoto(
                    img,
                    Extra       
                        .load({caption: caption})
                        .markup(inlineMessageRatingKeyboard)
                        .HTML()
                )
            } else {
                ctx.replyWithPhoto(
                    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Wikipedia-logo-en-big.png/489px-Wikipedia-logo-en-big.png',
                    Extra
                        .load({caption: caption})
                        .markup(inlineMessageRatingKeyboard)
                        .HTML()
                )
            }
        })
        .catch(error => {
            console.log(error)
            ctx.telegram.sendMessage(
                ctx.from.id,
                'No article found'
            )
        })       
    }
})

bot.catch(error => {
    console.log('telegraf error', error.response, error.parameters, error.on || error)
})

async function startup() {
    await bot.launch()
    console.log(new Date(), 'Bot started as', bot.options.username)
}
  
startup()
    