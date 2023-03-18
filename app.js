const puppeteer = require('puppeteer');
const Sequelize = require('sequelize');
const fs = require("fs")
const readline = require('readline');
const {
    QueryTypes
} = require('sequelize');
const jsdom = require("jsdom");
const {
    JSDOM
} = jsdom;

const sequelize = new Sequelize('eduard72_consultagoogle', 'eduard72_felipe', 'oQnD~rzZWG&9', {
    host: 'sh-pro20.hostgator.com.br',
    dialect: "mysql",
    define: {
        freezeTableName: true,
        timestamps: false,
    },
    logging: false
});

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

sequelize.authenticate().then(() => { }).catch(err => {
    console.error('Erro ao conectar a banco de dados: ', err);
});

let options = {
    defaultViewport: {
        width: 1366,
        height: 768,
    },
    args: ['--no-sandbox'],
    headless: false,
};

async function app() {

    let browser = await puppeteer.launch(options);
    let page = await browser.newPage();

    const getConsultas = await sequelize.query("SELECT * FROM `consultas` WHERE status=0 ORDER BY RAND()", {
        type: QueryTypes.SELECT
    });

    var i = 0
    while (getConsultas.length > 0) {

        var url = getConsultas[i].consulta.replace(/\s/g, "+");

        await page.goto("https://www.google.com.br/search?q=" + url)

        await delay(5000)

        data = await page.evaluate(() => document.querySelector('*').outerHTML);
        dom = new JSDOM(data)

        var links = dom.window.document.querySelectorAll(".yuRUbf > a")

        for (var j = 0; j < links.length; j++) {

            await page.goto(links[j].href)
            await delay(5000)

            data = await page.evaluate(() => document.querySelector('*').outerHTML);

            var emailRegex = /\b[\w\.-]+@[\w\.-]+\.\w{2,}\b/g;
            var emails = data.match(emailRegex);
            console.log(emails);

            if (emails) {

                emails.forEach(async email => {

                    var verEmail = await sequelize.query("SELECT id FROM `emails` WHERE email="+email+"", {
                        type: QueryTypes.SELECT
                    });

                    if(verEmail != email){
                    await sequelize.query("INSERT INTO `emails`(`email`, `estado`, `categoria`) VALUES ('" + email + "','" + getConsultas[i].estado + "','" + getConsultas[i].categoria + "')", {
                        type: QueryTypes.INSERT
                    });
                }
                });
            }
        }

        break

        i++
    };





}
app()