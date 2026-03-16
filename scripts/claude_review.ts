import axios from 'axios';

async function callGithubApi(url: string, method: string = 'GET', data: any = null, token: string) {
    const headers = {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
    };
    const response = await axios({ url, method, data, headers });
    return response.data;
}

async function callLlmApi(apiKey: string, baseUrl: string | undefined, model: string, prompt: string) {
    // Check if it's direct Anthropic or a custom provider (like aishop24h.com which uses OpenAI format)
    const isAnthropicDirect = !baseUrl || baseUrl.includes('api.anthropic.com');
    
    if (isAnthropicDirect) {
        const url = baseUrl || 'https://api.anthropic.com/v1/messages';
        console.log(`Calling Anthropic API at ${url}...`);
        const headers = {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
        };
        const data = {
            model: model,
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }]
        };
        const response = await axios.post(url, data, { headers });
        return response.data.content[0].text;
    } else {
        // OpenAI-compatible (e.g. OpenRouter, aishop24h.com)
        const url = `${baseUrl!.replace(/\/$/, '')}/chat/completions`;
        console.log(`Calling OpenAI-compatible API at ${url}...`);
        const headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };
        const data = {
            model: model,
            messages: [{ role: 'user', content: prompt }]
        };
        const response = await axios.post(url, data, { headers });
        return response.data.choices[0].message.content;
    }
}

async function main() {
    const ghToken = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPOSITORY;
    const prNumber = process.env.PR_NUMBER;
    const filePath = process.env.REVIEW_FILE_PATH;
    const apiKey = process.env.CLAUDE_API_KEY;
    const baseUrl = process.env.CLAUDE_API_BASE;
    const model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20240620';

    if (!ghToken || !repo || !prNumber || !filePath || !apiKey) {
        console.error('Missing required environment variables.');
        process.exit(1);
    }

    try {
        console.log(`Fetching files for PR #${prNumber}...`);
        const filesUrl = `https://api.github.com/repos/${repo}/pulls/${prNumber}/files`;
        const files = await callGithubApi(filesUrl, 'GET', null, ghToken);

        const targetFile = files.find((f: any) => f.filename === filePath);
        if (!targetFile) {
            console.log(`File ${filePath} not found in this PR.`);
            return;
        }

        const patch = targetFile.patch || 'No changes detected in the patch.';
        const prompt = `You are an expert code reviewer. Please review the following changes in the file \`${filePath}\`.
Focus on:
1. Logic errors
2. Security vulnerabilities
3. Code quality and best practices
4. Performance issues

Changes (Git Patch):
\`\`\`diff
${patch}
\`\`\`

Provide your review in a concise manner. Use bullet points. If everything looks good, just say "LGTM".`;

        console.log(`Requesting review for ${filePath} from ${model}...`);
        const reviewComment = await callLlmApi(apiKey, baseUrl, model, prompt);

        console.log('Posting review comment...');
        const commentUrl = `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`;
        const commentBody = `### 🤖 Claude Code Review for \`${filePath}\`\n\n${reviewComment}`;
        await callGithubApi(commentUrl, 'POST', { body: commentBody }, ghToken);

        console.log('Review posted successfully.');
    } catch (error: any) {
        console.error('Error during code review:', error.response?.data || error.message);
        process.exit(1);
    }
}

main();
