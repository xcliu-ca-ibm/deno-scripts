import { Slackbot } from "https://raw.githubusercontent.com/cesar-faria/simple_slackbot/master/mod.ts";

const token = Deno.env.get("SLACK_TOKEN")
if (!token) {
    console.error("!!! did not find slack token, can be set via environment variable SLACK_TOKEN")
    Deno.exit(1)
}
const slackbot = new Slackbot(token)

const channel = Deno.env.get("SLACK_CHANNEL") || "#cicd-fvt-reports"
let message = Deno.env.get("SLACK_MESSAGE") || "*you can specify message via environment variable SLACK_MESSAGE*"

// specific for catalog build notification
const CATALOG_IMAGE = Deno.env.get("CATALOG_IMAGE")
const CATALOG_TAG = Deno.env.get("CATALOG_TAG")
const DATESTAMP = Deno.env.get("DATESTAMP")
if (CATALOG_IMAGE === "ibm-common-service-catalog") {
	message = `*A new catalog build for BedRock has been promoted:*
- \`hyc-cloud-private-daily-docker-local.artifactory.swg-devops.com/ibmcom/ibm-common-service-catalog:${CATALOG_TAG}\``
	if (DATESTAMP) {
		message += `
- \`hyc-cloud-private-daily-docker-local.artifactory.swg-devops.com/ibmcom/ibm-common-service-catalog:${DATESTAMP}\`
`
	}
}

await slackbot.sendMessage(`${channel}`, `${message}`);
