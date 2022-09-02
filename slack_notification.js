const CS_VERSIONS = {
    cd: "3.21.0",
    "cd-daily": "3.21.0",
    "cd-quay": "3.21.0",
    "cd-icr": "3.21.0",
    ltsr: "3.19.4",
    "ltsr-daily": "3.19.4",
    "ltsr-quay": "3.19.4",
    "ltsr-icr": "3.19.4",
    eus: "3.6.9",
    "eus-daily": "3.6.9",
    "eus-quay": "3.6.9",
    "eus-icr": "3.6.9",
    efix: "3.20.2",
    "efix-daily": "3.20.2",
    "efix-quay": "3.20.2",
    "efix-icr": "3.20.2",
    future: "3.99.0",
    "future-daily": "3.99.0",
    "future-quay": "3.99.0",
    "future-icr": "3.99.0",
}

let SOT = []
// try to utilize pipeline-CASE.json to refresh
try {
   SOT = JSON.parse(Deno.readTextFileSync(`/workdir/pipeline-CASE.json`)).specs
} catch (e) {
   console.log(`... not running in container`)
   try {
      SOT = JSON.parse(Deno.readTextFileSync(`./pipeline-CASE.json`)).specs
   } catch (e) {
      console.log(`... not seen in current directory`)
      try {
         // fetch the online version in github.ibm.com
         SOT = JSON.parse(Deno.readTextFileSync(`pipeline-CASE.json`)).specs
      } catch (e) {
         console.log(`... error to get online version`)
      }
   }
}

if (SOT.length > 4) {
   SOT.forEach(spec => {
      console.log(spec)
      // update CS_VERSIONS
      CS_VERSIONS[spec.style] = spec.csRelease
      CS_VERSIONS[spec.style + "-daily"] = spec.csRelease
      CS_VERSIONS[spec.style + "-quay"] = spec.csRelease
      CS_VERSIONS[spec.style + "-icr"] = spec.csRelease
   })
   console.log(CS_VERSIONS)
}

import { Slackbot } from "https://raw.githubusercontent.com/cesar-faria/simple_slackbot/master/mod.ts";

const token = Deno.env.get("SLACK_JOB_TOKEN") || Deno.env.get("SLACK_TOKEN")
if (!token) {
    console.error("!!! did not find slack token, can be set via environment variable SLACK_TOKEN")
    Deno.exit(1)
}
const slackbot = new Slackbot(token)

let channel = Deno.env.get("SLACK_CHANNEL") || "#icp-cicd-bots"
let message = Deno.env.get("SLACK_MESSAGE") || "*you can specify message via environment variable SLACK_MESSAGE*"

// specific for bvt notification
const SLACK_TO = Deno.env.get("SLACK_TO") || "cicd"
if (SLACK_TO) {
    if (SLACK_TO.toLowerCase() === 'sert') {
        channel = '#icp-sert-squad'
    }
    const PASS = Deno.env.get("SLACK_PASS")
    if (`${PASS}` === "false") {
        message = `:x: *${SLACK_TO}_bvt failed for ${Deno.env.get("TRAVIS_BRANCH")} by Travis <${(Deno.env.get("TRAVIS_JOB_WEB_URL") || 'hello').replace('https://', 'https://travis.ibm.com')}|job ${Deno.env.get("TRAVIS_JOB_NUMBER")}>*\n`
    } else {
        message = `:white_check_mark: *${SLACK_TO}_bvt passed for ${Deno.env.get("TRAVIS_BRANCH")} by Travis <${(Deno.env.get("TRAVIS_JOB_WEB_URL") || 'hello').replace('https://', 'https://travis.ibm.com')}|job ${Deno.env.get("TRAVIS_JOB_NUMBER")}>*\n`
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
        message = `*CS ${CS_VERSIONS[CATALOG_TAG]} catalog build for BedRock has been promoted: by Travis <${Deno.env.get("TRAVIS_BUILD_WEB_URL", "test").replace('https://', 'https://travis.ibm.com')}|build ${Deno.env.get("TRAVIS_BUILD_NUMBER")}>*
- \`hyc-cloud-private-daily-docker-local.artifactory.swg-devops.com/ibmcom/${CATALOG_IMAGE}:${CATALOG_TAG}\``
        if (DATESTAMP && ["cd", "ltsr", "efix", "eus", "future"].find(e => e === CATALOG_TAG)) {
            message += `
- \`hyc-cloud-private-daily-docker-local.artifactory.swg-devops.com/ibmcom/${CATALOG_IMAGE}:${DATESTAMP}\`
ChangeLog: <https://pages.github.ibm.com/IBMPrivateCloud/bedrock-build-contents/${CATALOG_TAG}/html/archive/CS-${CATALOG_TAG}-changelog${DATESTAMP.replace(CATALOG_TAG,"")}.html|CS-${CATALOG_TAG}-changelog${DATESTAMP.replace(CATALOG_TAG,"")}.html>
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
