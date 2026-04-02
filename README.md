# ZR System Frontend

Frontend do ZR System construído com `React`, `TypeScript`, `Vite`, `TanStack Query`, `React Hook Form` e componentes `shadcn/ui`.

## Requisitos

- `Node.js` instalado
- `pnpm` instalado
- Backend do projeto disponível

## Instalação

```bash
pnpm install
```

## Variáveis de ambiente

O frontend usa variáveis de ambiente do Vite. Hoje existe uma variável obrigatória para apontar a API.

Crie um arquivo `.env` na raiz do projeto a partir do exemplo:

```bash
cp .env.example .env
```

### Variáveis disponíveis

#### `VITE_API_BASE_URL`

- Descrição: URL base da API backend usada pelo cliente HTTP do frontend.
- Uso no código: [env.ts](/Users/pro/projetos/zrsystem/frontend/src/config/env.ts#L1)
- Exemplo:

```env
VITE_API_BASE_URL=http://localhost:3300
```

- Observações:
  - Não deve terminar com `/`. Se terminar, o frontend remove automaticamente.
  - Se a variável não for definida, o frontend usa `http://localhost:3300` como fallback.
  - Todas as rotas autenticadas, login, refresh de token e endpoints de `customers` e `form-metadata` dependem desse valor.

## Arquivo `.env.example`

O repositório já inclui um exemplo mínimo:

```env
VITE_API_BASE_URL=http://localhost:3300
```

## Como rodar em desenvolvimento

1. Instale as dependências:

```bash
pnpm install
```

2. Configure o ambiente:

```bash
cp .env.example .env
```

3. Ajuste `VITE_API_BASE_URL` se o backend estiver em outra porta ou host.

4. Inicie o servidor de desenvolvimento:

```bash
pnpm dev
```

5. Abra a URL exibida pelo Vite no terminal, normalmente:

```text
http://localhost:5173
```

## Fluxo esperado em desenvolvimento

- O frontend consome a API configurada em `VITE_API_BASE_URL`.
- A autenticação usa `Bearer token`.
- Ao receber `401`, o cliente HTTP tenta renovar a sessão automaticamente via rota de refresh.
- Para usar login e cadastro de clientes, o backend precisa estar ativo e com as rotas de autenticação e cadastro disponíveis.

## Scripts disponíveis

### `pnpm dev`

Inicia o Vite em modo desenvolvimento.

### `pnpm build`

Executa `tsc -b` e gera o build de produção com Vite.

### `pnpm preview`

Sobe o build já gerado localmente para validação.

### `pnpm lint`

Executa o ESLint no projeto.

### `pnpm typecheck`

Executa checagem de tipos com TypeScript sem gerar build.

### `pnpm format`

Formata arquivos `ts` e `tsx` com Prettier.

## Estrutura resumida

```text
src/
  app/
  components/ui/
  features/
    auth/
    customers/
    form-metadata/
  shared/
```

## Pontos importantes

- O frontend foi organizado por `feature`.
- O cadastro de clientes usa `form metadata` vindo do backend para montar parte do comportamento do formulário.
- A tela administrativa de metadata também depende da mesma API.

## Troubleshooting

### O frontend abre, mas nada carrega

Verifique:

- se o backend está rodando
- se `VITE_API_BASE_URL` está correto
- se a API responde em `http://localhost:3300` ou na URL configurada

### Erro de autenticação

Verifique:

- se as rotas `/auth/login` e `/auth/refresh` estão disponíveis no backend
- se o usuário utilizado existe no ambiente backend

### Mudança em `.env` não refletiu

Reinicie o `pnpm dev`. Variáveis do Vite são lidas na inicialização do servidor.
