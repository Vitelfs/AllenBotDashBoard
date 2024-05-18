import { } from 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js';



async function logout() {

  if(confirm('Deseja realmente sair?')){
      try {
          await firebase.auth().signOut();
          window.open("../../index.html", "_self");
      } catch (error) {
          console.error("Erro ao fazer logout:", error);
      }
  }
}

const button = document.getElementById('btn_deslogar');
button.addEventListener('click', logout);