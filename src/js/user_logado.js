import { } from './firebase_config.js';
import { } from 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js';

function getEmail() {
    return new Promise((resolve, reject) => {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                const userEmail = user.email;
                console.log("Email do usuário autenticado:", userEmail);
                resolve(userEmail);
            } else {
                console.log("Nenhum usuário autenticado.");
                reject("Nenhum usuário autenticado.");
            }
        });
    });
}


async function showName(){

    const userEmail = await getEmail();
    const userDb = await firebase.firestore().collection('condominio');
    const sindico = await userDb.where('email', '==', userEmail).get();
    const sindicoData = sindico.docs[0].data();
    const sindicoEmail = sindicoData.email;

    document.getElementById('user-name').innerHTML = " " + sindicoEmail;
    document.getElementById('user-name').style.color = '#FEEFAD';
    document.getElementById('user-name').style.fontWeight = 'bold';
    document.getElementById('user-name').style.textDecoration = 'underline';


}
const listaCompleta = []
const elementosPorPagina = 5;
let paginaAtual = 1;

function formatarWhasapp(whatsapp) {

    return whatsapp.replace(/(\d{2})(\d{2})(\d{4})(\d{4})/, '+$1 ($2) $3-$4');

}
function formatarCPF(cpf) {
    let moradorCpf = cpf.replace(/\D/g, ''); 
    return moradorCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

async function mostrarMorador() {

    const userEmail = await getEmail();
    const userDb = await firebase.firestore().collection('condominio');
    const sindico = await userDb.where('email', '==', userEmail).get();
    const sindicoData = sindico.docs[0].data();
    const codigoSindico = sindicoData.cod_Condominio;
    const moradorRef = await firebase.firestore().collection('moradores');
    const moradorCond = await moradorRef.where('condominio', '==', codigoSindico).get();

    try {
        moradorCond.forEach(doc => {

        if(doc.data().tipo == 'Com chat'){
            const morador = {
                nome: doc.data().nome,
                cpf: formatarCPF(doc.data().cpf),
                casa: doc.data().casa,
                tipo: doc.data().tipo,
                whatsapp: formatarWhasapp(doc.data().whatsapp),
                condominio: doc.data().condominio,
                foto: doc.data().foto,
                id: doc.data().id,
                status: doc.data().status
            };
            listaCompleta.push(morador); 
        } else {
            const morador = {
                nome: doc.data().nome,
                casa: doc.data().casa,
                tipo: doc.data().tipo,
                foto: doc.data().foto,
                id: doc.data().id,
                condominio : doc.data().condominio,
                status: doc.data().status
            }
            listaCompleta.push(morador); 
        }
        exibirElementos(listaCompleta, paginaAtual);
        exibirPaginacao(listaCompleta);
    });
    } catch(error) {
        console.log("A lista está vazia, erro: " + error);
    }
}

function exibirElementos(lista, pagina) {
  
    const startIndex = (pagina - 1) * elementosPorPagina;
    const endIndex = startIndex + elementosPorPagina;
  
    //console.log("Lista:", lista);
    console.log("startIndex:", startIndex);
    console.log("endIndex:", endIndex);
    const elementosDaPagina = lista.slice(startIndex, endIndex);
  
    console.log("elementos da pagina: ", elementosDaPagina);
  
    const moradorLista = document.getElementById('moradorLista');
    moradorLista.innerHTML = ''; 
  
    elementosDaPagina.forEach(morador => {
  
      console.log(morador);

        
        const moradorItem = document.createElement('li');
        moradorItem.setAttribute('id','moradorItem');
        moradorItem.setAttribute('class','item-list');


        const moradorNome = document.createElement('p');
        moradorNome.setAttribute('class','item');
        moradorNome.textContent = morador.nome;

        const moradorCasa = document.createElement('p');
        moradorCasa.setAttribute('class','item');
        moradorCasa.textContent = morador.casa;
           
        const moradorCPF = document.createElement('p');
        moradorCPF.setAttribute('class', 'item');
        moradorCPF.textContent = morador.cpf;
  
        const moradorWhasapp = document.createElement('p');
        moradorWhasapp.setAttribute('class','item');
        moradorWhasapp.textContent = morador.whatsapp;
  
        const moradorTipo = document.createElement('p');
        moradorTipo.setAttribute('class','item');
        moradorTipo.textContent = morador.tipo;
  
        
  
        const imgDiv = document.createElement('div');
        imgDiv.setAttribute('class','img-div');
  
        const deleteImg = document.createElement('img');
        deleteImg.setAttribute('class','icon');
        
        const editImg = document.createElement('img');
        editImg.setAttribute('class','icon');
        editImg.setAttribute('id','btn_editar');
        imgDiv.appendChild(editImg);
        imgDiv.appendChild(deleteImg);

        const moradorFoto = document.createElement('img');
        const imgDiv2 = document.createElement('div');
        baixarFoto(morador.id).then(url => {
            moradorFoto.setAttribute('src', url);
            moradorFoto.setAttribute('class', 'foto-morador');
            imgDiv2.setAttribute('class','img-div2');
            imgDiv2.appendChild(moradorFoto);
        });

        if(morador.status == 'ativo'){
            editImg.setAttribute('src','../img/editar.svg');
            editImg.style.cursor = 'pointer';
            editImg.addEventListener('click', () => {
                editClient(morador.id);
            });
            deleteImg.setAttribute('src','../img/remover.svg');
            deleteImg.addEventListener('click', () => {
                deleteClient(morador.id);
            });
            deleteImg.style.cursor = 'pointer';
            moradorItem.style.backgroundColor = 'white';
        }else if(morador.status == 'inativo'){
            editImg.setAttribute('src','../img/no-edit.png');
            editImg.style.cursor = 'default';
            deleteImg.setAttribute('src','../img/reload.png');
            deleteImg.addEventListener('click', () => {
                ativarCliente(morador.id);
            });
            deleteImg.style.cursor = 'pointer';
            moradorItem.style.backgroundColor = '#E9E9E9';
        }
        moradorItem.appendChild(moradorNome);
        moradorItem.appendChild(moradorCasa);
        moradorItem.appendChild(moradorCPF);
        moradorItem.appendChild(moradorWhasapp);
        moradorItem.appendChild(moradorTipo);
        moradorItem.appendChild(imgDiv2);
        moradorItem.appendChild(imgDiv);
        moradorLista.appendChild(moradorItem);
    });
  }

function exibirPaginacao(lista) {
    const numeroDePaginas = Math.ceil(lista.length / elementosPorPagina);
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = ''; 

    for (let i = 1; i <= numeroDePaginas; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        if (i === 1) { 
            button.setAttribute('class', 'botao-paginacao ativo');
        }
        button.classList.add('botao-paginacao');
        button.addEventListener('click', () => irParaPagina(i));
        paginationContainer.appendChild(button);
    }
}

function irParaPagina(pagina) {
   
    console.log("Pagina:", pagina);
    paginaAtual = pagina;
    exibirElementos(listaCompleta, pagina);
    atualizarPaginacao();
}

function atualizarPaginacao() {
  const botoesPaginacao = document.querySelectorAll('#pagination button');
  botoesPaginacao.forEach((botao, indice) => {
      if (indice + 1 === paginaAtual) {
          botao.classList.add('ativo');
      } else {
          botao.classList.remove('ativo');
      }
  });
}

async function getIp(){

    const userEmail = await getEmail();
    const userDb = await firebase.firestore().collection('condominio');
    const sindico = await userDb.where('email', '==', userEmail).get();
    const sindicoData = sindico.docs[0].data();
    const sindicoIp = sindicoData.ip_idface;
    
    return sindicoIp;
}


async function conectarFaceID() {
    
    const statusIco = document.getElementById('conexao_ico');
    const ip = await getIp();
    console.log(ip);
    try {
        console.log(`http://${ip}/login.fcgi`);
        const conexao = await axios.post(`http://${ip}/login.fcgi`, {
            login: 'admin',
            password: 'admin'
        });
        console.log(conexao.data);
        statusIco.style.color = '#25d366';
        return conexao.data.session;
    } catch(error) {
        console.log(error);
        statusIco.style.color = '#f15474';
    }
}

function editClient(id) {
    var width = 800;
    var height = 800;
    var left = (window.innerWidth - width) / 2;
    var top = (window.innerHeight - height) / 2;
    var options = 'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top;
  
    var url = './editar_morador.html?id=' + id;
  
    var popup = window.open(url, 'Edição de Usuário', options);
    if (!popup || popup.closed || typeof popup.closed == 'undefined') {
        alert('Por favor, desbloqueie os popups para continuar.');
    }
}

async function deleteClient(id) {

    if(confirm('Tem certeza que deseja desativar o morador?')) {
        const moradorDb = firebase.firestore().collection('moradores');
        const morador = await moradorDb.where('id', '==', id).get();
        await moradorDb.doc(morador.docs[0].id).update({
            status: "inativo"
        });
        window.open('./main_screen.html', '_self');


    }
}

async function ativarCliente(id) {

    if(confirm('Tem certeza que deseja ativar o morador?')) {
        const moradorDb = firebase.firestore().collection('moradores');
        const morador = await moradorDb.where('id', '==', id).get();
        await moradorDb.doc(morador.docs[0].id).update({
            status: "ativo"
        });
        window.open('./main_screen.html', '_self');
    }
    
}
async function baixarFoto(user_id) {

    console.log("1" + user_id);
    console.log("2" + session);
    try {
        const ip = await getIp();
        const response = await fetch(`http://${ip}/user_get_image.fcgi?user_id=${user_id}&session=${session}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'image/jpeg'
            }
        });
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        return url;
    } catch (error) {
        console.error('Erro ao baixar a foto:', error);
    }
}

const session = await conectarFaceID();
showName();
mostrarMorador();

