# **projeto de PPADS**

## **Grupo 7**

# **MediLembre: Seu Companheiro de Medicação para Idosos (v2)**

O MediLembre é uma aplicação web projetada para auxiliar idosos e seus cuidadores no gerenciamento eficiente e seguro de medicamentos. Esta é a versão v2, que corresponde à entrega da Iteração 2, com foco principal na **implementação da funcionalidade de Histórico de Medicações e gerenciamento de Cuidadores** (UC-009).

## **Tecnologias Utilizadas**

Esta aplicação é construída com uma stack moderna de JavaScript, utilizando React para o frontend e Supabase como backend e banco de dados.  
| Categoria | Tecnologia | Versão Mínima |  
| Ambiente de Runtime | Node.js | v18.17.0 |  
| Frontend | React (com Vite) | React v18.2.0 |  
| Backend (BaaS) | Supabase | v2.x.x |  
| Banco de Dados | PostgreSQL | (Gerenciado pelo Supabase) |  
| Estilização | Tailwind CSS | v3.4.6 |  
| Componentes UI | shadcn/ui | |  
| Roteamento | React Router | v6.25.1 |

## **Pré-requisitos de Desenvolvimento**

Para clonar e executar o MediLembre, você precisa ter as seguintes ferramentas instaladas em seu ambiente:

* **Git:** Para clonar o repositório.  
* **Node.js e npm:** Versão **v18.17.0 ou superior**.  
* **Supabase CLI:** Para gerenciar o ambiente de banco de dados local.  
* **Docker Desktop:** O Supabase CLI utiliza o Docker para rodar a instância local do PostgreSQL.

## **Instruções de Execução para Desenvolvedores**

Siga os passos abaixo para configurar e iniciar o ambiente de desenvolvimento local.

### **1\. Clonar e Acessar o Projeto**

Primeiro, clone o repositório do GitHub para a sua máquina local e acesse a pasta do projeto.  
\# Clone o repositório (substitua pela URL do seu repositório)  
git clone \[https://github.com/becaabreualmeida/pratpas-project.git\](https://github.com/becaabreualmeida/pratpas-project.git)

\# Acesse a pasta do projeto  
cd pratpas-project

### **2\. Configurar o Backend (Supabase Local)**

Este projeto usa a CLI do Supabase para rodar um ambiente completo de backend (banco de dados, autenticação, etc.) localmente usando Docker.  
\# Inicia a stack local do Supabase  
\# (Isso pode demorar alguns minutos na primeira vez)  
supabase start

Após iniciar, o terminal exibirá informações importantes, incluindo a **URL da API**, a **Chave anon (publishable key)** e a **URL do DB**. Você precisará delas para o próximo passo.  
\# Opcional: Para rodar as migrações e criar as tabelas  
supabase db reset

### **3\. Configurar Variáveis de Ambiente (Frontend)**

O frontend (Vite/React) precisa saber como se conectar ao backend Supabase local.

1. Na raiz do projeto, crie um arquivo chamado .env (use como base o arquivo .env.example ou crie um novo).  
2. Abra o arquivo .env e adicione as chaves que foram fornecidas no terminal pelo comando supabase start.

**Importante:** Com base na configuração do seu projeto (src/integrations/supabase/client.ts), o nome da variável da chave é VITE\_SUPABASE\_PUBLISHABLE\_KEY.  
\# Copie a API URL fornecida pelo comando "supabase start"  
VITE\_SUPABASE\_URL="\[http://127.0.0.1:54321\](http://127.0.0.1:54321)"

\# Copie a Chave "anon" (public) fornecida pelo comando "supabase start"  
VITE\_SUPABASE\_PUBLISHABLE\_KEY="SUA\_CHAVE\_ANON\_PUBLICA\_LOCAL\_AQUI"

### **4\. Instalar Dependências e Rodar o Frontend**

Com o backend rodando e o arquivo .env configurado, instale as dependências do Node.js e inicie o servidor de desenvolvimento do Vite.  
\# Instala todos os pacotes do package.json  
npm install

\# Inicia o servidor de desenvolvimento  
npm run dev

Abra o seu navegador e acesse [http://localhost:5173](https://www.google.com/search?q=http://localhost:5173) (ou a porta indicada no seu terminal) para ver a aplicação rodando.

### **5\. Construindo para Produção**

Para gerar os arquivos estáticos para deploy (hospedagem):  
\# Gera a pasta /dist com a versão otimizada do site  
npm run build

