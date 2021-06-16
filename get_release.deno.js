Deno.exit()
const target_default = (squad) => `cicd-${squad}`;
const squad_case_filter_string = (squad) =>
  squad.replace(/security-/, "").replace(/platform-/, "").replace(
    /ability.*/,
    "",
  ).replace(/-.*/, "").replace(/ing/, "").replace(/installer/, "odlm").replace(
    "kubernetes",
    "cloudapi",
  );
const squad_cases = {};
let cases = [];
let saved_squads = [];
let squads_mocks = [];
let squads_tests = [];
let saved_squads_mocks = [];
let saved_squads_tests = [];
try {
  cases = (await Deno.readTextFile("./cases.txt")).trim().split("\n").filter(
    (testcase) => !/#/.test(testcase),
  );
  // .filter(testcase => !/bvt/.test(testcase))
} catch (e) {}
try {
  saved_squads = (await Deno.readTextFile("./squads.txt")).trim().split("\n")
    .filter((line) => !/#/.test(line));
} catch (e) {}
try {
  saved_squads_tests = (await Deno.readTextFile("./squads_tests.txt")).trim()
    .split("\n")
    .filter((line) => !/#/.test(line));
} catch (e) {}
try {
  saved_squads_mocks = (await Deno.readTextFile("./squads_mocks.txt")).trim()
    .split("\n")
    .filter((line) => !/#/.test(line));
} catch (e) {}

const result = {};

const data = JSON.parse(await Deno.readTextFile("./release/pipeline-CS.json"))
  .filter((e) => e["deployable-type"])
  .map(
    (e) => [
      e["owning-squad"],
      e["deployable-spec"]["deployable-name"],
      e["deployable-spec"]["test-repo"],
    ],
  )
  .sort();

data.forEach((e) => {
  if (result.hasOwnProperty(e[0])) {
    result[e[0]].push([e[1], e[2]]);
  } else {
    result[e[0]] = [[e[1], e[2]]];
  }
});

const squads = Object.keys(result);
if (squads.length !== saved_squads.length) {
  console.log(`persisting squads...`);
  let text = "";
  squads.forEach((squad) => text += squad + "\n");
  await Deno.writeTextFile("squads.txt", text);
}

let Makefile = "";
squads.forEach((squad) => {
  console.log(`\t processing ${squad}`);
  const flag_squad_tests = result[squad].filter((test) => test[1] !== "");
  const flag_squad_mocks = result[squad].filter((test) => test[1] === "");
  const regex = new RegExp(`^${squad_case_filter_string(squad)}`);
  squad_cases[squad] = cases.filter((testcase) => regex.test(testcase));
  Makefile += `
.PHONY: cicd-${squad}
cicd-${squad}:
	[ -d common-svcs-sert-tests ] || \${SELF} cicd-setup-dependencies
`;
  if (flag_squad_tests.length > 0) {
    squads_tests.push(squad);
    Makefile += `	@cd common-svcs-sert-tests; ./run.sh -c ${
      squad_cases[squad].join(",")
    }\n`;
  } else if (flag_squad_mocks.length > 0 && squad_cases[squad].length > 0) {
    squads_mocks.push(squad);
    Makefile += `	@cd common-svcs-sert-tests; ./run.sh -c ${
      squad_cases[squad].join(",")
    }\n`;
  } else {
    Makefile += `	sleep 2\n`;
  }
});

await Deno.writeTextFile("Makefile.functional", Makefile);
if (squads_tests.toString() !== saved_squads_tests.toString()) {
  console.log(`persisting squads tests...`);
  let text = "";
  squads_tests.forEach((squad) => text += squad + "\n");
  await Deno.writeTextFile("squads_tests.txt", text);
}
if (squads_mocks.toString !== saved_squads_mocks.toString()) {
  console.log(`persisting squads mocks...`);
  let text = "";
  squads_mocks.forEach((squad) => text += squad + "\n");
  await Deno.writeTextFile("squads_mocks.txt", text);
}

// console.log(cases)
// console.log(squads.map(squad_case_filter_string))
// console.log(Makefile);
