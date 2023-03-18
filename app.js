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
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    ignoreDefaultArgs: ['--disable-extensions'],
    headless: true,
};

async function app() {

    console.log("Abrindo Browser");

    let browser = await puppeteer.launch(options);
    let page = await browser.newPage();

    const getConsultas = await sequelize.query("SELECT * FROM `consultas` WHERE status=0 ORDER BY RAND()", {
        type: QueryTypes.SELECT
    });

    var i = getConsultas.length
    var x = 0
    while (i > 0) {

        var url = getConsultas[x].consulta.replace(/\s/g, "+");

        await page.goto("https://www.google.com.br/search?q=" + url)
        console.log("Pesquisando...");

        await delay(5000)

        data = await page.evaluate(() => document.querySelector('*').outerHTML);
        dom = new JSDOM(data)

        var links = dom.window.document.querySelectorAll(".yuRUbf > a")

        for (var j = 0; j < links.length; j++) {

            await page.goto(links[j].href)
            await delay(5000)
            console.log("Abrindo novo link");

            data = await page.evaluate(() => document.querySelector('*').outerHTML);

            var emailRegex = /\b[\w\.-]+@[\w\.-]+\.\w{2,}\b/g;
            var emails = data.match(emailRegex);
            console.log(emails);

            if (emails) {

                console.log("Coletando emails");

                emails.forEach(async function(email) {                     
                    
                    var verEmail = await sequelize.query("SELECT id FROM `emails` WHERE email='"+email+"'", {
                        type: QueryTypes.SELECT
                   });
                   console.log("---")
                   console.log(verEmail)
                   console.log(email)
                   console.log("---")

                    if(verEmail != email){
                    await sequelize.query("INSERT INTO `emails`(`email`, `estado`, `categoria`) VALUES ('" + email + "','" + getConsultas[x].estado + "','" + getConsultas[x].categoria + "')", {
                        type: QueryTypes.INSERT
                    });
                }
                });
            }
        }

        i--
        x++
    };





}
app()