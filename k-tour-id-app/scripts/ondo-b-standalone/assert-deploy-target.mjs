import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import {
  APP_ROOT,
  HISTORICAL_B_PROJECT_ID,
  LOCAL_ONLY_PROJECT_ID,
  PERSONAL_DEPLOY_OWNER,
  PERSONAL_VERCEL_ORG_ID,
  PERSONAL_VERCEL_PROJECT_ID,
  PERSONAL_VERCEL_PROJECT_NAME,
  PERSONAL_VERCEL_USER,
} from "./policy.mjs"

async function readJson(path, label) {
  try {
    return JSON.parse(await readFile(path, "utf8"))
  } catch (error) {
    throw new Error(`${label} is missing or invalid: ${path}`, { cause: error })
  }
}

function assertPersonalOwner(owner) {
  if (owner !== PERSONAL_DEPLOY_OWNER) {
    throw new Error(`Refusing ONDO deployment without the personal ${PERSONAL_DEPLOY_OWNER} owner boundary`)
  }
}

async function protectedProjectIds() {
  const hosting = await readJson(resolve(APP_ROOT, ".openai/hosting.json"), "Protected A hosting identity")
  return new Set([hosting.project_id, HISTORICAL_B_PROJECT_ID])
}

export async function assertStandaloneDeploymentTarget({
  provider = process.env.ONDO_B_DEPLOY_PROVIDER,
  owner = process.env.ONDO_B_DEPLOY_OWNER,
  sitesProjectId = process.env.ONDO_B_SITE_PROJECT_ID,
  vercelUser = process.env.ONDO_B_VERCEL_USER,
  vercelScope = process.env.ONDO_B_VERCEL_SCOPE,
  vercelConfigPath = resolve(APP_ROOT, ".vercel/project.json"),
} = {}) {
  assertPersonalOwner(owner)
  const protectedIds = await protectedProjectIds()

  if (provider === "sites") {
    if (!sitesProjectId || sitesProjectId === LOCAL_ONLY_PROJECT_ID) {
      throw new Error("Refusing ONDO Sites deployment with the local-only placeholder project identity")
    }
    if (protectedIds.has(sitesProjectId)) {
      throw new Error("Refusing ONDO Sites deployment to an existing protected A or historical-B project")
    }
    return { provider, owner, projectId: sitesProjectId }
  }

  if (provider === "vercel") {
    if (vercelUser !== PERSONAL_VERCEL_USER) {
      throw new Error(`Refusing ONDO Vercel deployment without the personal ${PERSONAL_VERCEL_USER} user boundary`)
    }
    if (vercelScope) {
      throw new Error("Refusing ONDO Vercel deployment with --scope; the personal account must be used directly")
    }
    const project = await readJson(vercelConfigPath, "Vercel project identity")
    if (!project.projectId || protectedIds.has(project.projectId)) {
      throw new Error("Refusing ONDO Vercel deployment without a separate unprotected project identity")
    }
    if (
      project.projectId !== PERSONAL_VERCEL_PROJECT_ID
      || project.orgId !== PERSONAL_VERCEL_ORG_ID
      || project.projectName !== PERSONAL_VERCEL_PROJECT_NAME
    ) {
      throw new Error("Refusing ONDO Vercel deployment outside the approved personal ondo project identity")
    }
    return {
      provider,
      owner,
      projectId: project.projectId,
      projectName: project.projectName,
      orgId: project.orgId,
      user: vercelUser,
    }
  }

  throw new Error("Set ONDO_B_DEPLOY_PROVIDER to either sites or vercel before deployment")
}

if (process.argv[1] === import.meta.filename) {
  const target = await assertStandaloneDeploymentTarget()
  process.stdout.write(`${JSON.stringify(target, null, 2)}\n`)
}
