
function getIdUrl() {
    
    const url = window.location.href;
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const id = urlParams.get('id')
    return id;
}
async function preencherDadosExistentes() {
    
    const id = getIdUrl();
    console.log(id);
    const moradorDb = firebase.firestore().collection('moradores');
    const morador = await moradorDb.where('id', '==', id).get();

    document.getElementById('nome').value = morador.docs[0].data().nome;
    document.getElementById('cpf').value = morador.docs[0].data().cpf;
    document.getElementById('whatsapp').value = morador.docs[0].data().whatsapp;
    document.getElementById('casa').value = morador.docs[0].data().casa;
    document.getElementById('tipo').value = morador.docs[0].data().tipo;
}

async function editarMorador() {

    const id = getCpfUrl();

    const nome = document.getElementById('nome').value;
    const cpf = document.getElementById('cpf').value;
    const whatsapp = document.getElementById('whatsapp').value;
    const casa = document.getElementById('casa').value;
    const tipo = document.getElementById('tipo').value;

    const moradorDb = firebase.firestore().collection('moradores');
    const morador = await moradorDb.where('cpf', '==', id).get();


    if(confirm('Tem certeza que deseja alterar os dados do morador?')) {
        await moradorDb.doc(morador.docs[0].id).update({
            nome: nome,
            cpf: cpf,
            whatsapp: "55" + whatsapp,
            casa: casa,
            tipo: tipo,
        });
    }
    
}

async function conectarFaceID() {
    const ip = await getIp();
    return new Promise((resolve, reject) => {
        const statusIco = document.getElementById('conexao_ico');
        $.ajax({
            url: "http://" + ip + "/login.fcgi",
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                login: 'admin',
                password: 'admin'
            }),
            success: function(data) {
                resolve(data.session); 
            },
            error: function(xhr, status, error) {
                reject(error); 
            }
        });
    });
}
preencherDadosExistentes();

document.getElementById('enviarBotao').addEventListener('click', editarMorador);