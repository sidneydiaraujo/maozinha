import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { impedirAbrirArquivoSolto } from './componentes/soltar'
import { registrarErrosDaTela } from './registrarErros'
import './styles.css'

registrarErrosDaTela()
impedirAbrirArquivoSolto()

const raiz = document.getElementById('root')
if (!raiz) throw new Error('Elemento #root nao encontrado em index.html')

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
