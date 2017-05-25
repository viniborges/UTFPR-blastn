/**
 * Arquivo: server.js
 * Descrição: Arquivo responsável por levantar o serviço do Node para executar a aplicação através do Express.
 * Author: Luis Vinicius
 */

//Chamada das packages
let express = require('express');
let bodyParser = require('body-parser');
let request = require('request');
let cheerio = require('cheerio');

let app = express(); //Definição da aplicação através do express.
let port = process.env.PORT || 3000; //Porta onde a aplicação será executada.

app.use(bodyParser()); //Permite retornar os dados de um Post, usado para capturar os valores.

//Rota inicial, exibição dos campos do form
app.get('/', (req, res) => {
    res.send('<h1>Blastn</h1><form action="/blastn" method="POST"><label for="query">Query:</label><input name="query" id="query"> <label for = "subject" > Subject: </label> <input name = "subject" id = "subject" > </input> <input type = "submit" value = "Blastar!" ></form>');
})

//Rota para tratar o recebimento dos campos 
app.post('/blastn', (req, res) => {
    var query = req.body.query;
    var subject = req.body.subject;
    console.log(query + ' - ' + subject);
    var reqId = callBlastAlign(query, subject, res);
})

//Rota para tratar o ID da request do blastn
app.get('/blastn/:id', function(req, res) {
    var rID = req.params.id;
    request.post({
            url: 'https://blast.ncbi.nlm.nih.gov/Blast.cgi',
            form: {
                CMD: 'Get',
                FORMAT_TYPE: 'Text',
                RID: rID,
                FORMAT_OBJECT: 'Alignment'
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.110 Safari/537.36',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            method: 'POST'
        },
        function(err, httpResponse, body) {
            if (httpResponse.statusCode == 200) {
                console.log(body);
                res.send(body); //Envia o resultado para o navegador
            }
        }
    );
});

//Iniciando o servidor da aplicação.
app.listen(port, () => {
    console.log('Servidor iniciado em http://localhost:' + port);
});

//Rotina para tratar a primeira request do NCBI
function callBlastAlign(q, s, res) {
    var ret = request.post({
            url: 'https://blast.ncbi.nlm.nih.gov/BlastAlign.cgi',
            form: {
                CMD: 'put',
                QUERY: q,
                PROGRAM: 'blastn',
                DATABASE: 'n/a',
                FORMAT_TYPE: 'XML',
                SUBJECTS: s,
                BL2SEQ: 'on'
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.110 Safari/537.36',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            method: 'POST'
        },
        function idCallBack(e, r, body) {
            if (r.statusCode == 200) {
                console.log(r.statusCode);
                //Utiliza o cheerio para tratar o retorno e facilitar a identificação do campo do ID
                $ = cheerio.load(body);
                //Identifica todos os elementos do tipo input e cria a lista inputs
                var inputs = $('input[id]');
                //Retorna somente o elemento necessário
                var listInputs = inputs.attr('id', function(i, id) {
                    return id.name === 'RID';
                });
                var idParam = listInputs[0].attribs.value
                console.log(idParam);
                //Passa o valor identificado apra a próxima request
                res.redirect('/blastn/' + idParam);
            }
        }
    )
};