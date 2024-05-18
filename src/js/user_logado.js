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

    moradorCond.forEach(doc => {
        console.log(doc.id, ' => ', formatarCPF(doc.data().cpf));
    });

    try {
        moradorCond.forEach(doc => {
        const morador = {
            nome: doc.data().nome,
            cpf: formatarCPF(doc.data().cpf),
            casa: doc.data().casa,
            tipo: doc.data().tipo,
            whatsapp: formatarWhasapp(doc.data().whatsapp),
            condominio: doc.data().condominio,
            foto: doc.data().foto
        };
        console.log(morador);
        listaCompleta.push(morador); 
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
  
        const moradorFoto = document.createElement('p');
        moradorFoto.setAttribute('class','item');
        moradorFoto.textContent = morador.foto;

        if(moradorFoto.textContent == "Sim") {
            moradorFoto.style.color = 'green';
        } else {
            moradorFoto.style.color = 'red';
        }
  
        const imgDiv = document.createElement('div');
        imgDiv.setAttribute('class','img-div');
  
        const deleteImg = document.createElement('img');
        deleteImg.setAttribute('class','icon');
        deleteImg.setAttribute('src','../img/remover.svg');
        deleteImg.setAttribute('onclick', `deleteClient('${morador.cpf}')`);
  
        const editImg = document.createElement('img');
        editImg.setAttribute('class','icon');
        editImg.setAttribute('src','../img/editar.svg');
        editImg.setAttribute('onclick', `editClient('${morador.cpf}')`);
  
        imgDiv.appendChild(editImg);
        imgDiv.appendChild(deleteImg);

        moradorItem.appendChild(moradorNome);
        moradorItem.appendChild(moradorCasa);
        moradorItem.appendChild(moradorCPF);
        moradorItem.appendChild(moradorWhasapp);
        moradorItem.appendChild(moradorTipo);
        moradorItem.appendChild(moradorFoto);
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
    } catch(error) {
        console.log(error);
        statusIco.style.color = '#f15474';
    }
}
showName();
mostrarMorador();
conectarFaceID();
