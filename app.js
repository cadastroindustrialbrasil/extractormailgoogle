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

var sequelize = new Sequelize('eduard72_consultagoogle', 'eduard72_felipe', 'oQnD~rzZWG&9', {
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

app()

async function app() {

    let browser = await puppeteer.launch(options);

    try {
        console.log("Limpando o database")

        await sequelize.query("DELETE from emails where id not in ( SELECT * FROM(select min(id) from emails group by email) AS temp_tab)");
        await sequelize.query('DELETE FROM emails WHERE email like "%1%" || email like "%2%" || email like "%3%" ||email like "%4%" || email like "%5%" || email like "%6%" || email like "%7%" || email like "%8%" || email like "%9%"');

        let page = await browser.newPage();
        console.log("Abrindo Browser");


        const getConsultas = await sequelize.query("SELECT * FROM `consultas` WHERE status=0 ORDER BY RAND()", {
            type: QueryTypes.SELECT
        });

        var i = getConsultas.length
        var x = 0
        while (i > 0) {

            var url = getConsultas[x].consulta.replace(/\s/g, "+");

            await sequelize.query("UPDATE consultas SET status=1 WHERE id=" + getConsultas[x].id + "");
            console.log("Update Status")

            await page.goto("https://www.google.com.br/search?q=" + url)
            console.log("Pesquisando...");

            data = await page.evaluate(() => document.querySelector('*').outerHTML);
            dom = new JSDOM(data)

            /* var pages = dom.window.document.querySelectorAll("td > a[class='fl']")
             var npages = 0
 
             if (pages.length > 7) {
                 npages = 7
             } else (
                 npages = pages.length
             )
 
             if (npages == 0) { npages = 1 }
 
             for (var y = 0; y < npages; y++) {


            console.log("Página " + (y + 1))

            data = await page.evaluate(() => document.querySelector('*').outerHTML);
            dom = new JSDOM(data)*/

            var links = dom.window.document.querySelectorAll(".yuRUbf > a")

            for (var j = 0; j < links.length; j++) {

                var link = links[j].href

                if (!link.includes("pdf")) {

                    await page.goto(links[j].href)
                    await page.setDefaultTimeout(60000)

                    await delay(5000)
                    console.log(links[j].href);

                    data = await page.evaluate(() => document.querySelector('*').outerHTML);

                    var emailRegex = /\b[\w\.-]+@[\w\.-]+\.\w{2,}\b/g;
                    var emails = data.match(emailRegex);
                    console.log(emails);

                    if (emails) {

                        emails.forEach(async function (email) {

                            await sequelize.query("INSERT INTO `emails`(`email`, `estado`, `categoria`) VALUES ('" + email + "','" + getConsultas[x].estado + "','" + getConsultas[x].categoria + "')", {
                                type: QueryTypes.INSERT
                            });

                        });
                    }
                    }
                }

                await delay(6000)

               /* await page.goto("https://www.google.com.br/search?q=" + url)
                await delay(6000)

                await page.click('a[aria-label="Page ' + (y + 2) + '"]')
                await delay(6000)*/

                links = []

           // }

            i--
            x++
        };

    } catch (err) {
        console.log(err)
        browser.close()
        app()
    }


}
