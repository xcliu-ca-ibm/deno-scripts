import { Slackbot } from "https://raw.githubusercontent.com/cesar-faria/simple_slackbot/master/mod.ts";

const token = Deno.env.get("SLACK_TOKEN")
if (!token) {
    console.error("!!! did not find slack token, can be set via environment variable SLACK_TOKEN")
    Deno.exit(1)
}
const slackbot = new Slackbot(token)

const channel = Deno.env.get("SLACK_CHANNEL") || "#icp-cicd-bots"
let message = Deno.env.get("SLACK_MESSAGE") || "*you can specify message via environment variable SLACK_MESSAGE*"

// specific for bvt notification
const SLACK_TO = Deno.env.get("SLACK_TO") || "cicd"
if (SLACK_TO) {
    if (SLACK_TO === 'cicd') {
        channel = '#icp-cicd-bots'
    } else {
        channel = '#icp-cicd-bots'
    }
    const PASS = Deno.env.get("SLACK_PASS")
    console.log(PASS)
    if (`${PASS}` === "false") {
        message = `*${SLACK_TO}_bvt failed for ${Deno.env.get("TRAVIS_BRANCH")} by Travis Job <${(Deno.env.get("TRAVIS_JOB_WEB_URL") || 'hello').replace('https://', 'https://travis.ibm.com')}|job ${Deno.env.get("TRAVIS_JOB_NUMBER")}>*\n`
    } else {
        message = `*${SLACK_TO}_bvt passed for ${Deno.env.get("TRAVIS_BRANCH")} by Travis Job <${(Deno.env.get("TRAVIS_JOB_WEB_URL") || 'hello').replace('https://', 'https://travis.ibm.com')}|job ${Deno.env.get("TRAVIS_JOB_NUMBER")}>*\n`
    }
}
// specific for catalog build notification
const CATALOG_IMAGE = Deno.env.get("CATALOG_IMAGE")
if (CATALOG_IMAGE) {
    const CATALOG_DIGEST = Deno.env.get("CATALOG_DIGEST")
    const AMD_DIGEST = Deno.env.get("AMD_DIGEST")
    const PPC_DIGEST = Deno.env.get("PPC_DIGEST")
    const S390_DIGEST = Deno.env.get("S390_DIGEST")
    const CATALOG_TAG = Deno.env.get("CATALOG_TAG") || "cd"
    const DATESTAMP = Deno.env.get("DATESTAMP")
    if (CATALOG_IMAGE === "ibm-common-service-catalog") {
        message = `*A new catalog build for BedRock has been promoted: by Travis <${Deno.env.get("TRAVIS_BUILD_WEB_URL").replace('https://', 'https://travis.ibm.com')}|build ${Deno.env.get("TRAVIS_BUILD_NUMBER")}>*
- \`hyc-cloud-private-daily-docker-local.artifactory.swg-devops.com/ibmcom/${CATALOG_IMAGE}:${CATALOG_TAG}\``
        if (DATESTAMP && ["cd", "efix", "eus"].find(e => e === CATALOG_TAG)) {
            message += `
- \`hyc-cloud-private-daily-docker-local.artifactory.swg-devops.com/ibmcom/${CATALOG_IMAGE}:${DATESTAMP}\`
`
        }
        if (CATALOG_DIGEST) {
            message += `
Catalog digest: \`${CATALOG_DIGEST}\`
`
        }
        if (AMD_DIGEST) {
            message += `amd64 digest: \`${AMD_DIGEST}\`
`
        }
        if (PPC_DIGEST) {
            message += `ppc64le digest: \`${PPC_DIGEST}\`
`
        }
        if (S390_DIGEST) {
            message += `s390x digest: \`${S390_DIGEST}\`
`
        }
    }
}

await slackbot.sendMessage(`${channel}`, `${message}`);
