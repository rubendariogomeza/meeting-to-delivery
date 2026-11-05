import type { JiraPlan } from "../core/schemas.js";

export interface JiraConfig {
  baseUrl: string;
  email: string;
  token: string;
  projectKey: string;
}

export function jiraConfigFromEnv(env: NodeJS.ProcessEnv = process.env): JiraConfig | null {
  const baseUrl = env.JIRA_BASE_URL?.trim();
  const email = env.JIRA_EMAIL?.trim();
  const token = env.JIRA_API_TOKEN?.trim();
  const projectKey = env.JIRA_PROJECT_KEY?.trim();
  if (!baseUrl || !email || !token || !projectKey) return null;
  return { baseUrl: baseUrl.replace(/\/+$/, ""), email, token, projectKey };
}

function authHeader(config: JiraConfig): string {
  return `Basic ${Buffer.from(`${config.email}:${config.token}`).toString("base64")}`;
}

async function jiraFetch(config: JiraConfig, path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      authorization: authHeader(config),
      accept: "application/json",
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(30_000),
  });
}

export interface ApplyResult {
  dryRun: boolean;
  skipped: boolean;
  created: Array<{ clientRef: string; key: string }>;
  reason?: string;
}

/**
 * Create the plan in Jira. Dry run by default: nothing is written unless
 * `apply` is true and credentials exist. Skips the whole plan when an issue
 * with the meeting label already exists, so a retry never duplicates work.
 */
export async function applyJiraPlan(
  plan: JiraPlan,
  config: JiraConfig | null,
  options: { apply: boolean },
): Promise<ApplyResult> {
  if (!options.apply || !config) {
    return { dryRun: true, skipped: false, created: [] };
  }

  const label = plan.issues[0]?.labels.find((item) => item.startsWith("mtg-"));
  if (label) {
    const jql = encodeURIComponent(`project = "${config.projectKey}" AND labels = "${label}"`);
    const search = await jiraFetch(config, `/rest/api/2/search?jql=${jql}&maxResults=1`);
    if (!search.ok) {
      throw new Error(`Jira rechazó la búsqueda de duplicados (${search.status}).`);
    }
    const found = (await search.json()) as { total?: number };
    if ((found.total ?? 0) > 0) {
      return { dryRun: false, skipped: true, created: [], reason: "El plan ya existe en Jira." };
    }
  }

  const created: Array<{ clientRef: string; key: string }> = [];

  for (const issue of plan.issues) {
    let accountId: string | null = null;
    if (issue.assignee.email) {
      const query = encodeURIComponent(issue.assignee.email);
      const user = await jiraFetch(config, `/rest/api/2/user/search?query=${query}&maxResults=1`);
      if (user.ok) {
        const users = (await user.json()) as Array<{ accountId?: string }>;
        accountId = users[0]?.accountId ?? null;
      }
    }

    const response = await jiraFetch(config, "/rest/api/2/issue", {
      method: "POST",
      body: JSON.stringify({
        fields: {
          project: { key: config.projectKey },
          summary: issue.summary,
          description: issue.description,
          issuetype: { name: issue.issueType },
          labels: issue.labels,
          ...(issue.due ? { duedate: issue.due } : {}),
          ...(accountId ? { assignee: { accountId } } : {}),
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `Jira rechazó "${issue.summary}" (${response.status}). ${detail.slice(0, 300)}. ` +
          `Se detuvo para no dejar issues a medias.`,
      );
    }

    const payload = (await response.json()) as { key?: string };
    created.push({ clientRef: issue.clientRef, key: payload.key ?? "?" });
  }

  return { dryRun: false, skipped: false, created };
}
