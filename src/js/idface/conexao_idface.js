import { } from '../firebase_config.js';
import { } from 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js';


const session = await conectarFaceID();
function getEmail() {
    return new Promise((resolve, reject) => {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                const userEmail = user.email;
                resolve(userEmail);
            } else {
                console.log("Nenhum usuário autenticado.");
                reject("Nenhum usuário autenticado.");
            }
        });
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
    
    const ip = await getIp();
    console.log(ip);
    try {
        console.log(`http://${ip}/login.fcgi`);
        const conexao = await axios.post(`http://${ip}/login.fcgi`, {
            login: 'admin',
            password: 'admin'
        });
        let session = conexao.data.session;
        const status = document.getElementById('status');
        status.innerHTML = 'Conectado!';
        status.style.color = '#25d366';
        status.style.fontWeight = 'bold';
        status.style.display = 'block';
        //exibirInformacoesEquipamento(session);
        return session;
    } catch (error) {
        console.error("Erro ao conectar ao FaceID:", error);
        const status = document.getElementById('status');
        status.innerHTML = 'Desconectado!';
        status.style.color = '#f15474';
        status.style.fontWeight = 'bold';
        status.style.display = 'block';
    }
}

export { conectarFaceID };

async function exibirInformacoesEquipamento() {
    
    const ip = await getIp();
    try {
        const informacoes = await axios.post(`http://${ip}/system_information.fcgi?session=${session}`);

        document.getElementById('idface_ip').value = informacoes.data.network.ip;
        document.getElementById('idface_gateway').value = informacoes.data.network.gateway;
        document.getElementById('idface_netmask').value = informacoes.data.network.netmask;
        document.getElementById('idfacea_porta').value = informacoes.data.network.web_server_port;
    } catch (error) {
        console.error("Erro ao exibir as informações do equipamento:", error);
    }
}

async function restaurarPadraoDeFabrica(){

    const ip = await getIp();
    if(confirm('Tem certeza que deseja restaurar o padrao de fabrica?')){
        await axios.post(`http://${ip}/reset_to_factory_default.fcgi?session=${session}`, {
        keep_network_info: false
     });
    }

}

async function editarInformacoesEquipamento() {


    const idface_ip = document.getElementById('idface_ip');
    const idface_gateway = document.getElementById('idface_gateway');
    const idface_netmask = document.getElementById('idface_netmask');
    const idfacea_porta = document.getElementById('idfacea_porta');
    const btn_salvar = document.getElementById('btn_alterar');

   
    if(!document.querySelector('#btn_confirm_alterar').classList.contains('active')){
        idface_ip.setAttribute('readonly', true);
        idface_gateway.setAttribute('readonly', true);
        idface_netmask.setAttribute('readonly', true);
        idfacea_porta.setAttribute('readonly', true);
        btn_salvar.style.display = 'none';
        document.querySelector('#btn_confirm_alterar').classList.add('active');
    }
    else{
        idface_ip.removeAttribute('readonly');
        idface_gateway.removeAttribute('readonly');
        idface_netmask.removeAttribute('readonly');
        idfacea_porta.removeAttribute('readonly');
        btn_salvar.style.display = 'block';
        document.querySelector('#btn_confirm_alterar').classList.remove('active');
    }

        
}

async function salvarInformacoesEquipamento() {

    const idface_ip = document.getElementById('idface_ip');
    const idface_gateway = document.getElementById('idface_gateway');
    const idface_netmask = document.getElementById('idface_netmask');
    const idfacea_porta = document.getElementById('idfacea_porta');

    const ip = await getIp();
    if(confirm('Tem certeza que deseja alterar as informações do equipamento?')){

        const userDb = await firebase.firestore().collection('condominio');
        const sindico = await userDb.where('ip_idface', '==', ip).get();

        const docId = sindico.docs[0].id;

        await userDb.doc(docId).update({ ip_idface: idface_ip.value });
            
        if(conectarFaceID() != null){
            await axios.post(`http://${ip}/set_system_network.fcgi?session=${session}`, {
                ip: idface_ip.value,
                gateway: idface_gateway.value,
                netmask: idface_netmask.value,
                web_server_port: parseInt(idfacea_porta.value)
            }).then(() => {
                window.location.reload();
            }).catch(error => {
                console.error("Erro ao conectar ao FaceID:", error);
            });
        } else {
            window.location.reload();
        }
    }
}
exibirInformacoesEquipamento();

const testeConexao = document.querySelector('#btn_testar');
testeConexao.addEventListener('click', () => {
    exibirInformacoesEquipamento();
});

const restaurarPadrao = document.querySelector('#btn_restaurar');
restaurarPadrao.addEventListener('click', restaurarPadraoDeFabrica);

const editarInformacoes = document.querySelector('#btn_confirm_alterar');
editarInformacoes.addEventListener('click', editarInformacoesEquipamento);

const salvarAlteracoes = document.querySelector('#btn_alterar');
salvarAlteracoes.addEventListener('click', () => {
    salvarInformacoesEquipamento();
})

