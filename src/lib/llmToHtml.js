// https://gist.github.com/celsowm/2bf6368524eee6df953fd655449aee7c
export function convertTextToHTML(text) {
    // Primeira etapa: detectar e converter tabelas
    let lines = text.split('\n');
    let htmlParts = [];
    let i = 0;

    while (i < lines.length) {
        // Verifica se a linha atual parece ser um cabeçalho de tabela
        if (isTableHeader(lines[i]) && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
            // Encontramos um possível bloco de tabela
            const headerLine = lines[i];
            const dividerLine = lines[i + 1];
            let bodyLines = [];
            i += 2;
            // Captura todas as linhas até a próxima que não seja de tabela
            while (i < lines.length && isTableRow(lines[i])) {
                bodyLines.push(lines[i]);
                i++;
            }
            // Converte o bloco em HTML de tabela
            const tableHTML = convertTableBlockToHTML(headerLine, dividerLine, bodyLines);
            htmlParts.push(tableHTML);
        } else {
            // Linha normal, apenas armazena e segue
            htmlParts.push(lines[i]);
            i++;
        }
    }

    let html = htmlParts.join('\n');

    // A partir daqui, o mesmo processo que já existia no seu código:
    // Extrai blocos de código
    const codeBlocks = [];
    let placeholderIndex = 0;

    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
        codeBlocks.push({ language, code });
        return `@@CODE_BLOCK_${placeholderIndex++}@@`;
    });

    // Código inline
    html = html.replace(/`([^`]+)`/g, (match, code) => {
        const escapedCode = code
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        return `<code>${escapedCode}</code>`;
    });

    // Cabeçalhos dinâmicos
    html = html.replace(/^(#{1,6})\s+(.*)$/gm, (match, hashes, content) => {
        const level = Math.min(hashes.length, 6);
        return `<h${level}>${content}</h${level}>`;
    });

    // Negrito e itálico
    html = html
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Listas não ordenadas (*, +, -)
    html = html.replace(/^(\s*)[*+\-]\s+(.*)$/gm, (match, indent, content) => {
        const level = indent.length; // Cada espaço conta como um nível
        const processedContent = content
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>");
        return `<ul class="level-${level}"><li>${processedContent}</li></ul>`;
    });

    // Listas ordenadas
    html = html.replace(/^(\s*)\d+\.\s+(.*)$/gm, (match, indent, content) => {
        const level = indent.length; // Cada espaço conta como um nível
        const processedContent = content
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>");
        return `<ol class="level-${level}"><li>${processedContent}</li></ol>`;
    });

    // Agrupa listas consecutivas
    html = html.replace(/<\/(ul|ol)>\s*<\1 class=".*?">/g, "");

    // Substitui quebras de linha por <br>, exceto dentro de tags block-level específicas
    html = html.replace(/\n(?!<\/?(ul|ol|li|h1|h2|h3|h4|h5|h6|pre|code|table|thead|tbody|tr|th|td)>)/g, "<br>");

    // Reinsere blocos de código
    html = html.replace(/@@CODE_BLOCK_(\d+)@@/g, (match, index) => {
        const { language, code } = codeBlocks[Number(index)];
        const langClass = language ? ` class="language-${language}"` : "";
        const escapedCode = code
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        return `<pre><code${langClass}>${escapedCode}</code></pre>`;
    });

    return html;
}

// Função auxiliar para verificar se uma linha é um cabeçalho de tabela Markdown
function isTableHeader(line) {
    return /^\|(.+)\|$/.test(line.trim());
}

// Função auxiliar para verificar se uma linha é o separador de tabela (---)
function isTableDivider(line) {
    line = line.trim();
    if (!/^\|(.+)\|$/.test(line)) return false;
    const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
    // Geralmente são "---" ou ":---:" etc. no markdown
    return cells.every(c => /^:?-{3,}:?$/.test(c));
}

// Função auxiliar para verificar se uma linha é uma linha de dados da tabela
function isTableRow(line) {
    return /^\|(.+)\|$/.test(line.trim());
}

// Converte um bloco de tabela (cabeçalho + divisória + linhas) em HTML
function convertTableBlockToHTML(headerLine, dividerLine, bodyLines) {
    const headerCells = splitTableLine(headerLine);
    // dividerLine não precisa extrair, apenas valida o formato, já foi feito acima
    const bodyCells = bodyLines.map(l => splitTableLine(l));

    let thead = '<thead><tr>' + headerCells.map(h => `<th>${h}</th>`).join('') + '</tr></thead>';
    let tbody = '<tbody>' + bodyCells.map(row => '<tr>' + row.map(c => `<td>${c}</td>`).join('') + '</tr>').join('') + '</tbody>';

    return `<table>${thead}${tbody}</table>`;
}

// Divide uma linha de tabela em células
function splitTableLine(line) {
    // Remove espaço e as barras das extremidades
    line = line.trim();
    if (line.startsWith('|')) line = line.substring(1);
    if (line.endsWith('|')) line = line.substring(0, line.length - 1);
    // Agora divide por '|'
    const cells = line.split('|').map(c => c.trim());
    return cells;
} 