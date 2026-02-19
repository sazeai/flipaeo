// To install: npm i @tavily/core
const { tavily } = require('@tavily/core');
const client = tavily({ apiKey: "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" });
client.search("digital marketing trends 2025", {
    includeAnswer: "advanced",
    searchDepth: "advanced",
    country: "australia"
})
.then(console.log);


countries supported by tavily

Boost search results from a specific country. This will prioritize content from the selected country in the search results. Available only if topic is general.

Available options: afghanistan, albania, algeria, andorra, angola, argentina, armenia, australia, austria, azerbaijan, bahamas, bahrain, bangladesh, barbados, belarus, belgium, belize, benin, bhutan, bolivia, bosnia and herzegovina, botswana, brazil, brunei, bulgaria, burkina faso, burundi, cambodia, cameroon, canada, cape verde, central african republic, chad, chile, china, colombia, comoros, congo, costa rica, croatia, cuba, cyprus, czech republic, denmark, djibouti, dominican republic, ecuador, egypt, el salvador, equatorial guinea, eritrea, estonia, ethiopia, fiji, finland, france, gabon, gambia, georgia, germany, ghana, greece, guatemala, guinea, haiti, honduras, hungary, iceland, india, indonesia, iran, iraq, ireland, israel, italy, jamaica, japan, jordan, kazakhstan, kenya, kuwait, kyrgyzstan, latvia, lebanon, lesotho, liberia, libya, liechtenstein, lithuania, luxembourg, madagascar, malawi, malaysia, maldives, mali, malta, mauritania, mauritius, mexico, moldova, monaco, mongolia, montenegro, morocco, mozambique, myanmar, namibia, nepal, netherlands, new zealand, nicaragua, niger, nigeria, north korea, north macedonia, norway, oman, pakistan, panama, papua new guinea, paraguay, peru, philippines, poland, portugal, qatar, romania, russia, rwanda, saudi arabia, senegal, serbia, singapore, slovakia, slovenia, somalia, south africa, south korea, south sudan, spain, sri lanka, sudan, sweden, switzerland, syria, taiwan, tajikistan, tanzania, thailand, togo, trinidad and tobago, tunisia, turkey, turkmenistan, uganda, ukraine, united arab emirates, united kingdom, united states, uruguay, uzbekistan, venezuela, vietnam, yemen, zambia, zimbabwe