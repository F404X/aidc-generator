# AIDC Studio

Gerador universal de códigos AIDC (Automatic Identification and Data Capture), com interface em português, personalização avançada, exportação de imagem e processamento no navegador.

**110 simbologias no catálogo**, distribuídas entre códigos bidimensionais, lineares, varejo, GS1, postais e saúde/HIBC. A lista acompanha os identificadores disponíveis no motor `bwip-js` 4.11.4. Nem toda simbologia aceita texto arbitrário: normas de GS1, pagamentos, documentos e códigos postais exigem dados e estruturas próprias.

## Funcionalidades

- QR Code customizável: módulos, cantos, cores, nível de correção de erros e imagem central (PNG/JPG/WEBP até 2 MB).
- Templates de QR Code para texto/URL, redes Wi‑Fi, contato vCard 3.0, e-mail (`mailto:`) e PIX estático (BR Code com CRC16).
- Outros formatos 1D e 2D, incluindo Code 128/39/93, EAN, UPC, ITF, Data Matrix, PDF417, Aztec, MaxiCode, GS1 DataBar, GS1-128, HIBC, padrões postais e mais.
- Prévia reativa, busca no catálogo por nome/aplicação, aviso para cores com baixo contraste.
- Exportação **PNG, SVG, JPG e WEBP**; cópia de imagem e conteúdo para a área de transferência.
- **Geração em lote** de até 60 itens por vez com download de um ZIP. O lote usa o **conteúdo de cada linha como dado bruto**, inclusive no modo QR. Os resultados com falha entram em `erros.txt`.
- Layout responsivo (desktop e celular), acessibilidade básica, atalhos e sem backend.

## Executar localmente

Este site é **estático**, feito com HTML, CSS e JavaScript (módulos ES). Não precisa instalar dependências nem compilar. É necessário ter **acesso à internet para baixar as bibliotecas a partir dos CDNs** quando a página carrega; as informações introduzidas pelo usuário não são enviadas ao CDN.

```bash
# Requer Node.js 18+; porta padrão 4173
npm run dev
```

Abra `http://localhost:4173` no navegador. Alternativa sem Node:

```bash
python -m http.server 4173
```

Atenção: abrir `index.html` diretamente com `file://` pode bloquear módulos ES e a API de clipboard em alguns navegadores. Use um servidor local.

### Testes

```bash
npm run check
npm test
```

Os testes automatizados cobrem o catálogo, geração de Wi‑Fi/vCard/e-mail/PIX, CRC e funções auxiliares. A leitura efetiva e a exportação de cada simbologia devem ser verificadas em um navegador moderno e com scanner compatível. **Não há afirmação de certificação GS1, bancária ou postal**.

## Criar e publicar o repositório GitHub

Crie um repositório vazio com o nome `aidc-generator` em [github.com/new](https://github.com/new?name=aidc-generator). **Não** marque “Add a README”, pois o projeto já tem um. Depois, dentro da pasta extraída do ZIP, execute:

```bash
git init
git branch -M main
git add .
git commit -m "feat: initial AIDC Studio release"
git remote add origin https://github.com/F404X/aidc-generator.git
git push -u origin main
```

Você precisa estar autenticado no GitHub pelo Git Credential Manager ou credencial equivalente. Alternativa: se tiver GitHub CLI autenticada, rode `gh repo create F404X/aidc-generator --public --source=. --remote=origin --push` dentro da pasta (sem os comandos acima).

## Deploy

### Cloudflare Pages

1. Envie os arquivos para um repositório GitHub.
2. No painel Cloudflare, crie um projeto **Workers & Pages → Pages → Connect to Git**.
3. Selecione o repositório e defina:
   - **Framework preset:** None
   - **Build command:** deixe vazio (sem build)
   - **Build output directory:** `.` (raiz do repositório)
4. Faça o deploy. O arquivo `_headers` aplica cabeçalhos de segurança na Cloudflare Pages.

### GitHub Pages

Em **Settings → Pages**, configure **Deploy from a branch** → `main` → `/(root)`. O site funciona como conteúdo estático; o arquivo `_headers` é específico da Cloudflare Pages.

## Atalhos

| Atalho | Ação |
| --- | --- |
| `Ctrl/Cmd + Enter` | Atualizar prévia |
| `Ctrl/Cmd + S` | Baixar PNG |
| `/` | Abrir biblioteca de formatos (fora de campos de texto) |
| `Esc` | Fechar biblioteca / menu de exportação |

## Notas importantes

- **Logo central:** suportada somente pelo **QR Code comum** (`qrcode`). QR GS1, Data Matrix, Aztec, MaxiCode etc. não recebem logos, para preservar suas regras. A biblioteca usa correção de erros `H` automaticamente quando há logo, mas isso **não garante leitura**. Teste com leitores e impressão reais; mantenha margem/contraste.
- **PIX:** o modelo cria **BR Code estático** (não uma cobrança dinâmica). Confira chave, valor e identificação do recebedor no aplicativo bancário antes de qualquer pagamento. Não use uma chave de teste pensando que a cobrança será liquidada.
- **Normas especializadas:** formatos GS1, ISBN/ISSN, UPC/EAN, HIBC, postais ou documentos podem exigir GTINs válidos, dígitos verificadores, AIs, conjuntos de caracteres, comprimentos, licenças ou campos especiais. O gerador fornece a simbologia, **não emite identificadores oficiais**.
- **Privacidade:** a geração é feita localmente no navegador. O site carrega scripts e fontes de serviços externos; estes podem receber metadados usuais de uma requisição HTTP (ex.: endereço IP), mas não o conteúdo digitado para gerar os códigos. O app não possui backend, analytics nem mecanismo de upload de dados. Imagens usadas como logos são lidas via `FileReader`.
- **Offline:** nesta versão, os arquivos JavaScript externos dependem de conexão à internet para carregamento inicial. Para uma implantação totalmente offline, hospede versões auditadas dos recursos de terceiros no próprio domínio e atualize os caminhos no `index.html` e na política CSP.
- **Clipboard:** copiar imagens exige contexto seguro (`https://` ou localhost) e suporte do navegador à Clipboard API.
- **Exportação:** SVG é vetorial; PNG/JPG/WEBP são rasterizados com a dimensão configurada. O navegador pode usar PNG como fallback quando não suportar o formato solicitado.

## Arquitetura

```text
aidc-generator/
├── index.html           # marcação e estrutura do aplicativo
├── styles.css           # design responsivo e dark mode
├── assets/favicon.svg
├── src/
│   ├── app.mjs          # interações, biblioteca, lote e exportação
│   ├── catalog.mjs      # catálogo de 110 simbologias
│   ├── renderer.mjs     # QR estilizado, bwip-js e SVG/Canvas
│   ├── payloads.mjs     # modelos de conteúdo e PIX CRC16
│   └── utils.mjs        # cor, contraste, nomes e utilitários
├── scripts/serve.mjs    # servidor HTTP de desenvolvimento
├── tests/payloads.test.mjs
├── _headers             # headers para Cloudflare Pages
├── package.json
└── LICENSE
```

### Bibliotecas (via CDN, versões fixas)

| Biblioteca | Versão | Papel |
| --- | --- | --- |
| [`bwip-js`](https://github.com/metafloor/bwip-js) | 4.11.4 | Renderização das simbologias BWIPP |
| [`qr-code-styling`](https://github.com/kozakdenys/qr-code-styling) | 1.9.2 | QR Code visual, logo e correção de erros |
| [`JSZip`](https://stuk.github.io/jszip/) | 3.10.1 | ZIP de códigos em lote |
| [`Lucide`](https://lucide.dev/) | 0.468.0 | Ícones de interface |
| Google Fonts: DM Sans, Space Grotesk | online | Tipografia (com fallback local) |

Código original publicado sob a **licença MIT**. Cada biblioteca possui licença própria; mantenha os avisos correspondentes conforme as licenças dessas dependências.