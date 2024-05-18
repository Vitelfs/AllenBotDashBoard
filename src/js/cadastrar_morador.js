import firebase from 'firebase/compat/app';
import { } from './firebase_config.js';

async function cpfJaCadastrado(cpf) {
    try {
        const moradorDb = firebase.firestore().collection('moradores');
        const querySnapshot = await moradorDb.where('cpf', '==', cpf).get();
        return !querySnapshot.empty;
    } catch (error) {
        console.error("Erro ao verificar CPF:", error);
        return false; 
    }
}

function getEmail() {
    return new Promise((resolve, reject) => {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                const userEmail = user.email;
                console.log("E-mail do usuário autenticado:", userEmail);
                resolve(userEmail);
            } else {
                console.log("Nenhum usuário autenticado.");
                reject("Nenhum usuário autenticado.");
            }
        });
    });
}

async function getCondominio() {
    try {
        const userEmail = await getEmail();
        console.log("E-mail obtido:", userEmail);

        const userDb = firebase.firestore().collection('condominio');
        const sindico = await userDb.where('email', '==', userEmail).get();
        const sindicoData = sindico.docs[0].data();
        
        console.log("Dados do sindico:", sindicoData);
        
        const cod_condominio = sindicoData.cod_Condominio;
        console.log("Código do condomínio:", cod_condominio);

        return cod_condominio;
    } catch (error) {
        console.error("Erro ao obter condomínio:", error);
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

        console.log("Morador:", morador);

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
                    ultimoMorador =  await moradorDb.orderBy('timestamp', 'desc').limit(1).get();
                    await moradorDb.add(morador);
                    createUser(ultimoMorador.id);
                    alert("Morador Cadastrado com sucesso!");
                    console.log("Morador cadastrado:", morador);
                }
            }
            document
        } catch (error) {
            console.error("Erro ao cadastrar morador:", error);
            alert("Erro ao Cadastrar Morador");
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
console.log("Sessão:", session);

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
                console.log('Logou com sucesso');
                resolve(data.session); // Resolva a promessa com o valor de session
            },
            error: function(xhr, status, error) {
                console.error('Erro ao conectar:', error);
                statusIco.style.color = '#f15474';
                document.getElementById('section').style.display = 'none';
                reject(error); // Rejeite a promessa com o erro
            }
        });
    });
}

async function createUser(id_morador) {

    const ip = await getIp();
    const nome = document.getElementById('nome').value;
    const morador = firebase.firestore().collection('moradores').doc(id_morador);
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
          console.log("tipo de id: " + typeof id);
          console.log('ID: ' + id);
          console.log('Morador criado com sucesso');
          userToGroup(id,ip,id_morador);
        },
        error: function(xhr, status, error) {
          console.log(error);
        }});
}

async function userToGroup(id,ip,id_morador){

    console.log("Id: " + id);
    console.log(typeof id);
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
                data: bytesDaImagem.buffer // Use o buffer do array de bytes
            });
            console.log('Imagem enviada com sucesso');
            morador.update({foto: "Sim"});
            document.getElementById('enviarBotao').style.display = 'block';
        }
        reader.readAsArrayBuffer(file);
    }
    else {
        alert('Por favor, selecione uma imagem.');
    }         
}

document.getElementById('enviarBotao').addEventListener('click', function(){
    cadastrarMorador();
});



