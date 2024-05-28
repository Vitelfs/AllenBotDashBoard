

import { } from './firebase_config.js';

async function cpfJaCadastrado(cpf) {
    try {
        console.log(cpf);
        const moradorDb = firebase.firestore().collection('moradores');
        const morador = await moradorDb.where('cpf', '==', cpf).get();
        const condominio = await getCondominio();

        console.log(morador.docs[0].data().condominio);
        console.log(condominio);


        if(morador.docs[0].data().condominio == condominio){
            return true;
        }
        return false;
    } catch (error) {
        return false; 
    }
}


function getEmail() {
    return new Promise((resolve, reject) => {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                const userEmail = user.email;
                resolve(userEmail);
            } else {
                reject("Nenhum usuário autenticado.");
            }
        });
    });
}

async function getCondominio() {
    try {
        const userEmail = await getEmail();
    
        const userDb = firebase.firestore().collection('condominio');
        const sindico = await userDb.where('email', '==', userEmail).get();
        const sindicoData = sindico.docs[0].data();
        
        const cod_condominio = sindicoData.cod_Condominio;

        return cod_condominio;
    } catch (error) {
        return null;
    }
}

async function cadastrarMorador() {
    
        const cod_condominio = await getCondominio();
        console.log("Código do condomínio obtido:", cod_condominio);
        document.getElementById('enviarBotao').style.display = 'none';
        const morador = {
            nome : document.getElementById("nome").value,
            cpf : document.getElementById("cpf").value,
            whatsapp : document.getElementById("whatsapp").value,
            casa : document.getElementById("casa").value,
            tipo : document.getElementById("tipo").value,
            condominio : cod_condominio,
            id: "",
            foto: "Não"
        };

        if(morador.nome == "" || morador.cpf == "" || morador.whatsapp == "" || morador.casa == "" || morador.condominio == "" || morador.tipo == "" || document.getElementById('inputImagem').files.length == 0) {
            alert('Preencha todos os campos');
            document.getElementById('enviarBotao').style.display = 'block';
            return;
        }

        const moradorDb = firebase.firestore().collection('moradores');

        try {
            if(!validarCPF(morador.cpf) && !validarNumeroWhatsapp(morador.whatsapp)){ 
                document.getElementById('cpf-erro').style.display = 'block';
                document.getElementById('cpf-erro').innerHTML = 'CPF inválido';
                document.getElementById('numero-erro').style.display = 'block';
                document.getElementById('numero-erro').innerHTML = 'Número inválido';
                document.getElementById('enviarBotao').style.display = 'block';
                if(!validarCPF(morador.cpf)){ 
                    document.getElementById('cpf-erro').style.display = 'block';
                    document.getElementById('cpf-erro').innerHTML = 'CPF inválido';
                    document.getElementById('enviarBotao').style.display = 'block';
                }else if(!validarNumeroWhatsapp(morador.whatsapp)){
                    document.getElementById('numero-erro').style.display = 'block';
                    document.getElementById('numero-erro').innerHTML = 'Número inválido';
                    document.getElementById('enviarBotao').style.display = 'block';
                }
            }
            else {
                const cpfExistente = await cpfJaCadastrado(morador.cpf);
                if (cpfExistente) {
                    document.getElementById('cpf-erro').style.display = 'block';
                    document.getElementById('cpf-erro').innerHTML = 'CPF já cadastrado';
                    document.getElementById('enviarBotao').style.display = 'block';
                } else {
                    document.getElementById('numero-erro').style.display = 'none';
                    document.getElementById('cpf-erro').style.display = 'none';
                    await moradorDb.add(morador);
                    const ultimoMorador =  await moradorDb.where('nome', '==', morador.nome).get();
                    const moradorId = ultimoMorador.docs[0].id;
                    createUser(moradorId);
                    alert('Morador criado com sucesso!');
                    
                }
            }
           
        } catch (error) {
            alert("Erro ao Cadastrar Morador");
            document.getElementById('enviarBotao').style.display = 'block';
        }

}

function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');

    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }

    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;

    if (remainder !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;

    if (remainder !== parseInt(cpf.charAt(10))) return false;

    return true;
}
function validarNumeroWhatsapp(numero) {
    
    const regex = /^(55)(\d{2})(\d{8})$/;

    return regex.test(numero);
}

async function getIp(){

    const userEmail = await getEmail();
    const userDb = await firebase.firestore().collection('condominio');
    const sindico = await userDb.where('email', '==', userEmail).get();
    const sindicoData = sindico.docs[0].data();
    const sindicoIp = sindicoData.ip_idface;
    
    return sindicoIp;
}

//ID FACE

const session = await conectarFaceID();

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
                statusIco.style.color = '#25d366';
                document.getElementById('section').style.display = 'flex';
                document.getElementById('loading').style.display = 'none';
                resolve(data.session); // Resolva a promessa com o valor de session
            },
            error: function(xhr, status, error) {
                statusIco.style.color = '#f15474';
                document.getElementById('section').style.display = 'none';
                reject(error); // Rejeite a promessa com o erro
            }
        });
    });
}

async function createUser(id_morador) {

    console.log("Morador id:", id_morador);
    const ip = await getIp();
    const nome = document.getElementById('nome').value;
    console.log("Nome:", nome);
    const morador = await firebase.firestore().collection('moradores').doc(id_morador);
    console.log("Morador:", morador);
    $.ajax({
        url: "http://" + ip + "/create_objects.fcgi?session=" + session,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
          object: "users",
          values: [{registration: 'morador', name: nome}]
        }),
        success: function(data) {
          const id = data.ids[0];
          morador.update({id: id});
          userToGroup(id,ip,id_morador);
        },
        error: function(xhr, status, error) {
          console.log(error);
        }});
}

async function userToGroup(id,ip,id_morador){

    $.ajax({
        url: "http://" + ip + "/create_objects.fcgi?session=" + session,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
          object: "user_groups",
          values: [{user_id: id, group_id: 1}]
        }),
        success: function(data) {
          console.log('Morador adicionado ao grupo');
          enviarImagem(id,ip,id_morador);
        },
        error: function(xhr, status, error) {
          console.log(error);
        }
        }
    );
}

function enviarImagem(id,ip,id_morador){

    var input = document.getElementById('inputImagem');
    const morador = firebase.firestore().collection('moradores').doc(id_morador);
    
    // Verifica se um arquivo foi selecionado
    if (input.files && input.files[0]) {
        var file = input.files[0];
        var reader = new FileReader();

        reader.onload = async function(e) {
            var bytesDaImagem = new Uint8Array(e.target.result);
            $.ajax({
                url: "http://" + ip + "/user_set_image.fcgi?user_id=" + id + "&timestamp=1691586816&match=0&session=" + session,
                type: 'POST',
                contentType: 'application/octet-stream',
                processData: false, // Evitar que o jQuery converta os dados
                data: bytesDaImagem.buffer,
                success: function(data) {
                    console.log(data);
                    console.log('Imagem enviada com sucesso');
                    morador.update({foto: 'Sim'});
                },
                error: function(xhr, status, error){
                    console.log(error);
                    alert('Erro ao enviar imagem');
                    morador.update({foto: 'Não'});
                    document.getElementById('imagem-erro').style.display = 'block';
                } // Use o buffer do array de bytes
            });
        }
        reader.readAsArrayBuffer(file);
        
    }
    else {
        alert('Por favor, selecione uma imagem.');
    }
    document.getElementById('nome').value = '';
    document.getElementById('cpf').value = '';
    document.getElementById('casa').value = '';
    document.getElementById('whatsapp').value = '';
    document.getElementById('inputImagem').value = '';
    document.getElementById('tipo').value = 'C';
    document.getElementById('enviarBotao').style.display = 'block';         
}

document.getElementById('enviarBotao').addEventListener('click', function(){
    cadastrarMorador();
});




