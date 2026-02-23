import os

# Centralized configuration and prompt variables for cms_main

openai_api_key = os.environ.get("OPENAI_API_KEY", "")


DEFAULT_MODEL_MAP = {
    "m10": "gpt-4.1-mini",
    "m11": "gpt-4.1-mini",
    "m12": "gpt-4.1",
    "m13": "gpt-4.1-mini",
    "m21": "gpt-4.1",
    "m22": "gpt-4.1",
    "m23": "gpt-4.1",
    "m24": "gpt-4.1",
    "m25": "gpt-4.1-mini",
    "m26": "gpt-4.1",
    "m27": "gpt-4.1",
    "m28": "gpt-4.1",
    "m30": "gpt-4.1",
    "m31": "gpt-4.1-mini",
    "m32": "gpt-4.1-mini",
    "m40": "gpt-4.1",
    "m41": "gpt-4.1-mini",
    "m42": "gpt-4.1-mini",
    "m43": "gpt-4.1-mini",
    "m50": "gpt-4.1-mini",
}


def _build_model_map():
    return {
        stage: os.environ.get(f"CMS_MODEL_{stage.upper()}", default)
        for stage, default in DEFAULT_MODEL_MAP.items()
    }


MODEL_MAP = _build_model_map()


def get_model_for_stage(stage: str) -> str:
    """Return the model assigned to a specific stage, allowing env overrides."""
    env_key = f"CMS_MODEL_{stage.upper()}"
    if env_key in os.environ:
        return os.environ[env_key]
    return MODEL_MAP.get(stage, DEFAULT_MODEL_MAP.get("m30", "gpt-4.1"))

contract_types = ["msz", "ingadvet", "aszf", "lemnyil", "figy", "egyeb"]

guides = {
    "msz": [
        "For Munkaszerződés, divide into logical lines and extract advanced details: Termination clauses like justifications, immediate rules, and severance details \n Confidentiality clauses on trade secrets, IP rights, and data protection \n Non-compete clauses covering time, scope, and industry/activity restrictions \n Leave policies including sick leave, annual leave, and unpaid leave specifics \n Payment details such as salary adjustments, mid-year bonus rules, and reimbursement terms \n Relocation clauses specifying relocation requirements and travel obligations \n Conflict resolution clauses including governing law, arbitration, and jurisdiction details \n Amendment rules for valid changes and severability.",
        "For Employment Contracts, evaluate formatting to ensure: All key sections like job details, salary, and termination clauses are clearly labeled and well-structured \n Dates and identifiers like employee and employer details follow consistent formatting \n Numerical data such as salary, working hours, and notice periods are formatted accurately with appropriate units \n Avoidance of ambiguous phrasing or undefined terms \n Ensure clauses are not overly lengthy or convoluted, keeping sections concise and organized for readability.",
        "For Employment Contracts, evaluate risks and issues: Ensure clauses do not waive employee rights unlawfully or contradict labor laws \n Identify vague or ambiguous terms that could lead to disputes \n Check for missing legally required details like working hours, salary frequency, and probation period conditions \n Verify confidentiality and non-compete clauses are reasonable in scope and duration \n Ensure termination clauses are clear and comply with legal standards \n Highlight overly restrictive or unfair provisions that could harm either party \n Evaluate clarity and enforceability of all clauses for both parties.",
        "For Employment Contracts, consolidate analyses by grouping issues into categories like legal inconsistencies, formatting problems, and missing information \n Ensure redundancies in identified risks are eliminated while retaining all unique findings \n Provide a comprehensive overview of problematic areas such as unfair clauses, non-compliance with labor laws, or overly restrictive terms \n Clearly summarize critical risks related to termination, confidentiality, non-compete clauses, and employee rights \n Use structured sections to present findings for better readability and clarity.",
        "For Employment Contracts, create a user-friendly output: Summarize the document by clearly outlining key sections like job details, salary, working hours, and termination terms \n Highlight important clauses such as probation period, confidentiality, and non-compete agreements \n Provide a separate section summarizing identified risks or issues, excluding lines marked as '0' \n Use bullet points or short paragraphs for clarity \n Ensure the summary is concise but comprehensive, avoiding legal jargon to make it accessible for non-legal users.",
        "For Employment Contracts, perform a meticulous review of the input: Focus on the second part summarizing risks and issues, checking for overlooked details or misinterpretations \n Ensure all identified issues are clearly justified and no risks are omitted \n Pay extra attention to termination clauses, non-compete agreements, and ambiguous terms \n Highlight any inconsistencies or vague areas that require further clarification \n If no mistakes or omissions are found, respond with '0'.",
        "For Employment Contracts, translate the input into the given language while ensuring: Precise and accurate adaptation of legal terminology \n Natural and contextually appropriate expressions without mirroring the original phrasing \n Clarity in translating technical or nuanced clauses like confidentiality, non-compete, and termination terms \n Retention of the intended meaning and tone across all sections \n Avoidance of literal translations that could lead to misinterpretation.",
        "For Employment Contracts, standard and generally acceptable laws include: \n 2012. évi I. törvény (Munka Törvénykönyve) - Governs labor relations, working hours, salaries, and employee rights \n 2011. évi CXII. törvény (Info Act) - Regulates data protection and the handling of employee personal data \n 1997. évi LXXX. törvény (Social Security Act) - Covers social security contributions and employee benefits \n 2003. évi XCII. törvény (Taxation Act) - Governs tax obligations related to employment."
    ],
    "ingadvet": [
        "For Movable Property Sales Agreements, divide into logical lines and extract advanced details: Precise descriptions of the object being sold, including unique identifiers like serial numbers and condition \n Payment details such as agreed price, method, and deadlines \n Ownership transfer clauses specifying timing and conditions \n Warranty or as-is clauses detailing seller obligations \n Penalties for delayed payments or failure to deliver \n Dispute resolution mechanisms including jurisdiction or arbitration \n Signature validation for both parties and witness signatures if required.",
        "For Movable Property Sales Agreements, evaluate formatting to ensure: Clear and consistent labeling of key sections like item description, payment terms, and transfer of ownership \n Dates, numerical data, and identifiers such as serial numbers or invoice numbers are formatted accurately \n Avoidance of ambiguous descriptions or undefined terms \n Ensure clauses regarding payment and warranties are clearly separated and logically ordered \n Maintain readability with concise and organized sections.",
        "For Movable Property Sales Agreements, evaluate risks and issues: Ensure the description of the item is accurate, detailed, and unambiguous \n Verify that payment terms, including deadlines and methods, are clearly defined and enforceable \n Check ownership transfer clauses for clarity on timing and conditions \n Ensure warranty or as-is clauses are explicitly stated and do not conflict with consumer protection laws \n Identify any penalties for late payment or delivery failure to ensure they are reasonable and enforceable \n Highlight vague or overly restrictive terms that could lead to disputes \n Evaluate the document for compliance with jurisdictional requirements and applicable laws.",
        "For Movable Property Sales Agreements, consolidate analyses by grouping issues into categories such as legal inconsistencies, formatting problems, and missing details \n Eliminate redundant risks while ensuring all unique findings are retained \n Summarize critical risks like vague ownership transfer terms, unclear payment conditions, and warranty ambiguities \n Provide structured sections to enhance clarity and readability for legal teams or clients.",
        "For Movable Property Sales Agreements, create a user-friendly output: Summarize the document by outlining key sections such as item description, payment terms, and ownership transfer \n Highlight important clauses including warranty, penalties for non-compliance, and dispute resolution \n Provide a separate section summarizing identified risks or issues, excluding lines marked as '0' \n Use bullet points or short paragraphs to ensure clarity \n Keep the summary concise, avoiding overly technical language while retaining precision.",
        "For Movable Property Sales Agreements, perform a meticulous review of the comprehensive summary: Focus on the section summarizing risks and issues, ensuring all identified risks are justified and no significant points are missed \n Pay close attention to ambiguous item descriptions, unclear payment terms, and incomplete warranty clauses \n Highlight any inconsistencies, vague areas, or overlooked details that require clarification \n If no issues or omissions are found, respond with '0'.",
        "For Movable Property Sales Agreements, translate the comprehensive summary into the original document's language while ensuring: Precise and contextually accurate adaptation of legal and technical terms \n Avoid literal translations that could misinterpret contractual nuances \n Ensure clarity in translating clauses such as payment terms, ownership transfer, and warranty conditions \n Retain the intended meaning and tone while making the text natural and legally sound in the target language.",
        "For Movable Property Sales Agreements, standard and generally acceptable laws include: \n 1959. évi IV. törvény (Civil Code) - Governs general contractual obligations, including sales agreements \n 1997. évi CLV. törvény (Consumer Protection Act) - Ensures consumer rights in the sale of goods \n 2001. évi CVIII. törvény (E-Commerce Act) - Regulates online sales and electronic contracts \n 2013. évi V. törvény (New Civil Code) - Covers specific provisions for sales contracts, warranties, and guarantees."
    ],
    "aszf": [
        "For Terms and Conditions, divide into logical lines and extract advanced details: Key definitions of terms used in the document \n User obligations and prohibited actions \n Payment terms such as billing frequency, refund policies, and penalties \n Liability disclaimers and limitations, including exclusions for indirect damages \n Governing law and jurisdiction clauses \n Termination conditions for either party \n Data protection clauses detailing user information handling \n Amendment clauses specifying how changes to the terms will be communicated and agreed upon.",
        "For Terms and Conditions, evaluate formatting to ensure: Clear and consistent labeling of sections like definitions, obligations, payment terms, and disclaimers \n Use uniform formatting for numerical data such as refund percentages or billing cycles \n Avoid ambiguous or inconsistent phrasing in critical sections like liabilities or user responsibilities \n Ensure structured readability with concise paragraphs or bullet points \n Verify proper alignment of legal references and citation styles.",
        "For Terms and Conditions, evaluate risks and issues: Ensure that liability disclaimers and limitations are clear and compliant with applicable laws \n Verify that payment terms, refund policies, and penalties are fair and enforceable \n Check for ambiguous or overly broad user obligations that could lead to disputes \n Ensure data protection clauses comply with relevant regulations like GDPR \n Identify any unfair or unbalanced terms that could disadvantage users or breach consumer rights \n Highlight missing or unclear amendment or termination clauses.",
        "For Terms and Conditions, consolidate analyses by grouping issues into categories such as liability concerns, formatting inconsistencies, and missing or ambiguous clauses \n Eliminate redundant findings while ensuring all unique risks are included \n Summarize critical risks such as vague liability exclusions, unclear refund terms, or insufficient data protection clauses \n Organize the findings into structured sections for enhanced clarity and usability.",
        "For Terms and Conditions, create a user-friendly output: Summarize the document by outlining key sections such as definitions, payment terms, user obligations, and liability disclaimers \n Highlight important clauses like data protection, amendment terms, and governing law \n Provide a separate section summarizing identified risks or issues, excluding lines marked as '0' \n Use concise bullet points or short paragraphs for readability \n Ensure the summary avoids overly technical language while remaining precise and comprehensive.",
        "For Terms and Conditions, perform a meticulous review of the comprehensive summary: Focus on the section summarizing risks and issues, ensuring all liability clauses, refund policies, and user obligations are correctly analyzed \n Highlight any overlooked ambiguities, inconsistencies, or unfair terms \n Pay special attention to compliance with data protection laws and clarity of amendment procedures \n If no mistakes or omissions are found, respond with '0'.",
        "For Terms and Conditions, translate the comprehensive summary into the original document's language while ensuring: Accurate and contextually adapted translation of legal and technical terms \n Avoid literal translations that may distort the meaning of liability disclaimers, refund policies, or user obligations \n Ensure clarity and precision in translating clauses on data protection, governing law, and amendment terms \n Retain the intended tone and legal nuance while making the text natural and comprehensible in the target language.",
        "For Terms and Conditions, standard and generally acceptable laws include: \n 2013. évi V. törvény (Civil Code) - Governs contractual obligations, including general terms and conditions \n 1997. évi CLV. törvény (Consumer Protection Act) - Ensures consumer rights and fair terms in contracts \n 2001. évi CVIII. törvény (E-Commerce Act) - Regulates electronic contracts and online terms of service \n 2011. évi CXII. törvény (Info Act) - Governs data protection and the handling of personal information in terms and conditions."
    ],
    "lemnyil": [
        "For Waiver Declarations, divide into logical lines and extract advanced details: Clear identification of the waiving party and the party benefiting from the waiver \n Precise description of the rights, claims, or obligations being waived \n Explicit acknowledgment of voluntary intent and understanding of consequences \n Time frame and conditions for the waiver's validity \n Jurisdiction and governing law for the waiver \n Signatures and, if applicable, witness attestations to validate consent.",
        "For Waiver Declarations, evaluate formatting to ensure: Clear and consistent labeling of sections such as waiving party, rights waived, and governing law \n Use precise and uniform language to describe the scope and limitations of the waiver \n Avoid ambiguous or overly broad statements that could lead to legal disputes \n Ensure structured readability with concise paragraphs or bullet points \n Verify proper alignment of legal references and citation styles for enforceability.",
        "For Waiver Declarations, evaluate risks and issues: Ensure the scope of the waiver is clearly defined and does not unintentionally extend to unrelated rights or obligations \n Verify that the waiver complies with applicable laws and does not infringe upon statutory rights \n Check for ambiguous language that could lead to disputes over the interpretation of the waiver \n Confirm the voluntary nature of the waiver and the inclusion of acknowledgment clauses \n Highlight missing or unclear time frames and conditions for the waiver’s validity \n Identify any clauses that might unfairly disadvantage the waiving party or create legal uncertainty.",
        "For Waiver Declarations, consolidate analyses by grouping issues into categories such as unclear scope, legal non-compliance, and missing validity conditions \n Eliminate redundant findings while ensuring all unique risks are included \n Summarize critical risks such as vague definitions of rights waived, insufficient acknowledgment of consent, or unfair conditions \n Organize findings into structured sections for clarity and usability.",
        "For Waiver Declarations, create a user-friendly output: Summarize the document by outlining key sections such as the parties involved, rights or claims waived, and validity conditions \n Highlight important clauses like acknowledgment of voluntary consent, governing law, and time frames \n Provide a separate section summarizing identified risks or issues, excluding lines marked as '0' \n Use concise bullet points or short paragraphs for clarity \n Ensure the summary avoids overly technical language while remaining precise and accessible.",
        "For Waiver Declarations, perform a meticulous review of the comprehensive summary: Focus on the section summarizing risks and issues, ensuring the scope of the waiver, acknowledgment clauses, and validity conditions are correctly analyzed \n Highlight any overlooked ambiguities, unfair terms, or non-compliance with statutory rights \n Pay special attention to the clarity of time frames and voluntary intent \n If no mistakes or omissions are found, respond with '0'.",
        "For Waiver Declarations, translate the comprehensive summary into the original document's language while ensuring: Accurate adaptation of legal terms and phrases specific to waivers \n Avoid literal translations that might obscure the intended scope or implications of the waiver \n Ensure clarity in translating acknowledgment clauses, time frames, and governing law \n Retain the intended tone and legal nuance while making the text natural and comprehensible in the target language.",
        "For Waiver Declarations, standard and generally acceptable laws include: \n 2013. évi V. törvény (Civil Code) - Governs the legal requirements and enforceability of waivers \n 2011. évi CXII. törvény (Info Act) - Regulates data protection if personal data is involved in the waiver \n 1959. évi IV. törvény (Old Civil Code) - Applies to waivers signed before the enactment of the New Civil Code \n 2008. évi XLVII. törvény (Unfair Commercial Practices Act) - Ensures waivers do not violate consumer protection laws."
    ],
    "figy": [
        "For Notice or Information Documents, divide into logical lines and extract advanced details: Precise identification of the issuing party and the recipient \n Clear statement of the purpose or intent of the notice \n Relevant dates, deadlines, or time frames mentioned in the document \n Specific obligations or actions required by the recipient, if applicable \n Reference to any governing law or legal basis for the notice \n Signatures or attestations validating the document, if required.",
        "For Notice or Information Documents, evaluate formatting to ensure: Clear and consistent labeling of sections such as issuing party, recipient, and purpose \n Use structured formatting for dates, deadlines, and actions required \n Avoid vague or ambiguous language that could lead to misunderstandings \n Ensure concise paragraphs or bullet points for readability \n Verify alignment of any legal references or citations mentioned in the notice.",
        "For Notice or Information Documents, evaluate risks and issues: Ensure the purpose and intent of the notice are clearly defined and unambiguous \n Verify that deadlines or time frames are reasonable and compliant with applicable laws \n Check for vague or overly broad statements that could lead to misinterpretation \n Confirm the obligations or actions required of the recipient are feasible and enforceable \n Highlight missing or unclear references to legal bases or governing laws \n Identify any inconsistencies or potential unfair terms that could cause disputes.",
        "For Notice or Information Documents, consolidate analyses by grouping issues into categories such as unclear purpose, ambiguous obligations, and missing legal references \n Eliminate redundant findings while ensuring all unique risks are included \n Summarize critical risks such as vague deadlines, insufficient detail in recipient actions, or lack of legal compliance \n Organize findings into structured sections for clarity and usability.",
        "For Notice or Information Documents, create a user-friendly output: Summarize the document by outlining key sections such as issuing party, purpose, and recipient obligations \n Highlight important details like deadlines, legal references, and required actions \n Provide a separate section summarizing identified risks or issues, excluding lines marked as '0' \n Use concise bullet points or short paragraphs for clarity \n Ensure the summary is accessible, avoiding overly technical language while remaining precise.",
        "For Notice or Information Documents, perform a meticulous review of the comprehensive summary: Focus on the section summarizing risks and issues, ensuring the purpose, deadlines, and recipient obligations are correctly analyzed \n Highlight any overlooked ambiguities, inconsistencies, or missing legal references \n Pay special attention to unclear or overly broad statements that could lead to misunderstandings \n If no mistakes or omissions are found, respond with '0'.",
        "For Notice or Information Documents, translate the comprehensive summary into the original document's language while ensuring: Accurate and contextually adapted translation of key terms and obligations \n Avoid literal translations that could obscure the intent or purpose of the notice \n Ensure clarity in translating deadlines, legal references, and recipient actions \n Retain the intended tone and purpose while making the text natural and comprehensible in the target language.",
        "For Notice or Information Documents, standard and generally acceptable laws include: \n 2013. évi V. törvény (Civil Code) - Governs the legal requirements for notices and communications between parties \n 2011. évi CXII. törvény (Info Act) - Regulates data protection when personal data is included in the notice \n 2008. évi XLVII. törvény (Unfair Commercial Practices Act) - Ensures notices do not mislead or unfairly disadvantage recipients \n 2003. évi XCII. törvény (Taxation Act) - Covers notices related to tax obligations or declarations."
    ],
    "egyeb": [
        "For Other Agreements, divide into logical lines and extract advanced details: Identification of all parties involved and their roles \n Clear description of the agreement's purpose and scope \n Specific obligations, rights, and responsibilities of each party \n Relevant dates, deadlines, or milestones included in the agreement \n References to governing law or legal frameworks \n Conditions for amendments, termination, or renewal \n Signatures or witness attestations validating the agreement, if required.",
        "For Other Agreements, evaluate formatting to ensure: Clear and consistent labeling of sections such as parties, purpose, and obligations \n Use structured formatting for dates, deadlines, and conditions \n Avoid ambiguous or overly broad language that could lead to misunderstandings \n Ensure concise paragraphs or bullet points for readability \n Verify alignment of legal references or citations mentioned in the agreement.",
        "For Other Agreements, evaluate risks and issues: Ensure the purpose and scope of the agreement are clearly defined and unambiguous \n Verify that obligations and responsibilities of each party are reasonable and enforceable \n Check for vague or overly broad terms that could lead to disputes \n Confirm compliance with applicable laws and alignment with governing legal frameworks \n Highlight missing or unclear conditions for amendments, termination, or renewal \n Identify any inconsistencies or potential unfair terms that could disadvantage any party.",
        "For Other Agreements, consolidate analyses by grouping issues into categories such as unclear purpose, ambiguous terms, and missing legal references \n Eliminate redundant findings while ensuring all unique risks are included \n Summarize critical risks such as undefined responsibilities, vague deadlines, or non-compliance with governing laws \n Organize findings into structured sections for clarity and usability.",
        "For Other Agreements, create a user-friendly output: Summarize the document by outlining key sections such as parties, purpose, obligations, and conditions \n Highlight important details like deadlines, legal references, and amendment or termination clauses \n Provide a separate section summarizing identified risks or issues, excluding lines marked as '0' \n Use concise bullet points or short paragraphs for clarity \n Ensure the summary avoids overly technical language while remaining precise and comprehensive.",
        "For Other Agreements, perform a meticulous review of the comprehensive summary: Focus on the section summarizing risks and issues, ensuring obligations, deadlines, and legal references are correctly analyzed \n Highlight any overlooked ambiguities, inconsistencies, or missing conditions for amendments or termination \n Pay special attention to unclear or overly broad terms that could lead to misunderstandings or disputes \n If no mistakes or omissions are found, respond with '0'.",
        "For Other Agreements, translate the comprehensive summary into the original document's language while ensuring: Accurate and contextually adapted translation of key terms, obligations, and conditions \n Avoid literal translations that could obscure the intent or scope of the agreement \n Ensure clarity in translating deadlines, legal references, and amendment or termination clauses \n Retain the intended tone and legal nuance while making the text natural and comprehensible in the target language.",
        "For Other Agreements, standard and generally acceptable laws include: \n 2013. évi V. törvény (Civil Code) - Governs general contractual obligations and enforceability \n 2011. évi CXII. törvény (Info Act) - Regulates data protection if personal data is involved in the agreement \n 2008. évi XLVII. törvény (Unfair Commercial Practices Act) - Ensures agreements comply with fairness standards and do not exploit any party \n 1997. évi CLV. törvény (Consumer Protection Act) - Applies if the agreement involves consumer transactions or rights."
    ]
}

# Instruction appended to every model prompt so that OpenAI responses keep
# placeholders intact.
_placeholder_notice = (
    "The document may contain placeholders in square brackets representing "
    "sensitive information. Use them verbatim and do not modify."
)

m10_prompt = "Analyze the text and identify its language. Consider linguistic markers, vocabulary patterns, and grammatical structures. Respond with only the language name in English (e.g., 'Hungarian', 'English', 'German')."

m11_prompt = """You are an expert paralegal specializing in contract classification. Analyze the provided text and classify it into one of these categories:

0. Employment Contract - hiring agreements, job offers, employment terms
1. Movable Property Sales Agreement - sales of goods, equipment, vehicles
2. Terms and Conditions - service agreements, user agreements, policy documents
3. Waiver Declaration - liability waivers, rights waivers, disclaimers
4. Notice or Information Document - notifications, announcements, informational letters
5. Other Agreements - any contract not fitting the above categories

Instructions:
- Read the entire document carefully
- Identify key contractual elements and subject matter
- Match to the most appropriate category based on primary purpose
- If multiple categories apply, choose the dominant one
- Only respond with the single digit number (0-5)
- Default to 5 only if truly uncertain

Respond with only the number."""

m12_prompt = """You are a senior paralegal at a prestigious law firm. Extract ALL information from the contract below with absolute completeness and precision.

Requirements:
- Format: i[number]. [Category] - [Information]
- Extract EVERY detail, no matter how minor
- Each line must contain one atomic piece of information
- Categories should be specific (e.g., \"Party 1 Name\", \"Effective Date\", \"Payment Terms\")
- Include all dates, names, amounts, addresses, terms, conditions, and legal references
- Preserve exact wording for critical terms
- A lawyer must be able to reconstruct the original contract from your extraction

Quality check: If a lawyer cannot recreate the original document from your output, you have failed.

Begin extraction:"""

m13_prompt = """You are a paralegal specializing in legal reference extraction. Extract ALL legal references from the document.

Format requirements:
- List each reference on a separate numbered line
- Use exact format: '[year]. évi [number]. törvény [section/paragraph if specified]'
- Include ALL components as they appear (year, law number, sections, clauses)
- Preserve original formatting and numbering
- Extract references in order of appearance
- No explanations or additional text

Example format:
1. 2012. évi I. törvény 15. § (2) bekezdés
2. 1992. évi XXII. törvény 52. §

Extract all references now:"""

m21_prompt = """You are a senior paralegal responsible for format validation. Check each extracted line (i1, i2, etc.) against Hungarian legal document standards.

Hungarian Format Standards:
- ID Number: exactly 8 characters
- TAJ (Social Security): exactly 9 digits
- Tax ID (Adóazonosító): exactly 10 digits
- Company Registry: exactly 15 characters
- Bank Account: exactly 24 characters
- IBAN: exactly 28 characters (2-letter country + 26 digits)
- SWIFT/BIC: exactly 6 or 11 characters

Instructions:
- Ignore the full document context
- Check ONLY numbered lines (i1, i2, etc.)
- Validate format, length, and character types
- Check for typos, missing digits, incorrect formats
- Be precise about specific format violations

Response format:
- "[line number]: [specific format issue]" for problems
- "[line number]: 0" if format is correct

Begin validation:"""

m22_prompt = """You are a senior lawyer conducting risk assessment. Analyze each extracted line for legal risks and compliance issues.

Focus areas:
- Data privacy violations (GDPR, Hungarian data protection)
- Labor law compliance issues
- Financial/operational risks
- Legal inconsistencies or contradictions
- Missing mandatory information
- Ambiguous or unenforceable terms
- Regulatory non-compliance

Instructions:
- Analyze only numbered lines (i1, i2, etc.)
- Ignore the full document context
- Evaluate risks for ALL parties equally
- Consider Hungarian legal requirements
- Flag potential litigation risks
- Identify terms requiring clarification

Response format:
- "[line number]: [specific risk/issue]" for problems
- "[line number]: 0" if no issues found

Begin risk analysis:"""

m23_prompt = """You are an experienced lawyer reviewing contract terms for legal issues. Examine each extracted line for problems that could affect enforceability or create legal exposure.

Identify:
- Legal contradictions or inconsistencies
- Non-compliance with Hungarian labor/commercial law
- Vague, incomplete, or ambiguous terms
- Potentially illegal clauses
- Terms requiring further specification
- Red flags for any party signing
- Missing essential elements

Instructions:
- Review only numbered lines (i1, i2, etc.)
- Ignore full document context
- Provide unbiased analysis for all parties
- Flag anything requiring legal clarification
- Consider enforceability under Hungarian law

Response format:
- "[line number]: [identified legal issue]" for problems
- "[line number]: 0" if legally sound

Begin analysis:"""

m24_prompt = """You are a compliance lawyer reviewing contract terms for regulatory and practical issues. Assess each line for problems that could cause issues in practice.

Evaluation criteria:
- Regulatory compliance (Hungarian law, EU regulations)
- Data privacy compliance
- Contradictory or unclear terms
- Unenforceable provisions
- Client risk exposure
- Terms requiring modification
- Implementation difficulties

Instructions:
- Examine only numbered lines (i1, i2, etc.)
- Ignore full document context
- Provide balanced assessment for all parties
- Flag terms clients should review carefully
- Consider practical enforceability

Response format:
- "[line number]: [compliance issue/risk]" for problems
- "[line number]: 0" if compliant

Begin compliance review:"""

m25_prompt = """You are a meticulous paralegal known for catching every minor error in legal documents. Review each extracted line with extreme attention to detail.

Find ALL mistakes:
- Typos and spelling errors
- Missing punctuation or formatting
- Incorrect numbers or dates
- Grammatical errors
- Inconsistent terminology
- Missing information
- Formatting inconsistencies

Instructions:
- Examine only numbered lines (i1, i2, etc.)
- Ignore full document context
- Be pedantically thorough
- Catch errors others miss
- Flag even minor inconsistencies

Response format:
- "[line number]: [specific error/mistake]" for problems
- "[line number]: 0" if error-free

Begin detailed review:"""

m26_prompt = """You are a legal research specialist. Validate the provided legal reference using current Hungarian law databases.

Validation criteria:
1. Legal existence: Does this law actually exist?
2. Current validity: Is it still in force or repealed?
3. Format accuracy: Is the citation properly formatted?
4. Relevance: Is it appropriate for this contract type?
5. Standard usage: Is it commonly referenced in similar contracts?

Instructions:
- Use the full document for context only
- Focus solely on the specified legal reference
- Research current Hungarian legal databases
- Be strict in validation
- Consider only the exact reference provided

Response format:
- "0" if valid and meets all criteria
- Brief explanation if invalid (e.g., "law repealed 2020", "incorrect citation format", "not relevant to contract subject")

Begin validation:"""

m27_prompt = """You are a legal research expert tasked with suggesting improved legal references. Based on the identified issue with the current reference and the contract context, provide a better alternative.

Process:
1. Understand the issue with current reference
2. Analyze contract subject matter and purpose
3. Identify appropriate, current Hungarian law
4. Ensure relevance and standard usage
5. Provide proper legal citation format

Instructions:
- Review full document for context
- Consider the specific issue identified
- Suggest currently valid, relevant law
- Use proper Hungarian legal citation format
- Ensure the suggestion fits the contract type

Response format:
"Suggested reference: [year]. évi [number]. törvény - [brief justification for suitability]"

Provide suggestion:"""

m28_prompt = """You are a senior partner consolidating multiple legal analyses. Combine findings from 4 different reviews into a comprehensive summary.

Analysis types received:
1. Format/technical issues (treat separately)
2. Legal risk assessment
3. Compliance review
4. Detailed error detection

Consolidation requirements:
- Group similar issues by category
- Eliminate redundancy while preserving all unique findings
- Separate formatting issues from legal issues
- Provide complete coverage of all identified problems
- Use clear, structured presentation

Structure:
**FORMATTING ISSUES:**
- [List all format/technical problems]

**LEGAL RISKS & ISSUES:**
- Data Privacy Risks: [if any]
- Legal Inconsistencies: [if any]
- Compliance Issues: [if any]
- [Other relevant categories]

Include all findings without omission.

Begin consolidation:"""

m30_prompt = """You are a lawyer explaining complex legal documents to non-lawyers. Create a clear, accessible two-part summary.

Part 1: Document Summary
- Explain the document's purpose in plain language
- Identify key parties and their roles
- Summarize main terms and obligations
- Highlight important dates and conditions
- Use simple, non-technical language

Part 2: Issues & Risks Summary
- List all problems identified by analysis teams
- Exclude lines marked with '0'
- Include legal reference issues and suggestions
- Explain risks in understandable terms
- Prioritize issues by severity

Format:
**DOCUMENT SUMMARY:**
[Clear, concise explanation]

**IDENTIFIED ISSUES:**
[User-friendly explanation of all problems]

Create summary in English. Do not switch languages."""

m31_prompt = """You are a contract analyst preparing an executive-friendly briefing.

Input: the detailed English summary created earlier in the process.

Objective:
- Preserve every high-severity issue and recommended mitigation.
- Combine related points so the text can be read in under two minutes.
- Provide clear structure using short paragraphs or bullet-style lines.

Constraints:
- Limit the response to roughly 3–5 concise paragraphs.
- Keep the tone practical and actionable for business readers.
- Highlight critical follow-up items (e.g., signatures, dates, missing clauses).
- Write only in English.

Deliver the condensed "normal" summary now."""

m32_prompt = """You are a senior legal associate writing a lightning-fast briefing for executives.

Task:
- Read the detailed comprehensive summary.
- Produce an "ultra-short" summary containing the absolute essentials.
- Communicate the overall stance (safe to sign, proceed with caution, do not sign) plus the top actions.

Constraints:
- Use a maximum of 2–3 sentences.
- Keep sentences crisp and informative.
- Write exclusively in English.

Return the ultra-short summary now."""

m41_prompt = """You are a bilingual legal translator.

Translate the following DETAILED English summary into Hungarian while preserving:
- All section headings and emphasis markers (such as bold text).
- The legal nuance, risk prioritisation, and recommended actions.
- Natural, reader-friendly Hungarian phrasing appropriate for lawyers and business stakeholders.

Output only the Hungarian translation."""

m42_prompt = """You are a bilingual legal translator.

Translate the following NORMAL-LENGTH English summary into Hungarian.
- Keep paragraphs short and readable.
- Maintain every obligation, risk, and recommendation.
- Use natural Hungarian legal phrasing without literal word-for-word copying.

Respond only with the Hungarian translation."""

m43_prompt = """You are a bilingual legal translator.

Translate the following ULTRA-SHORT English summary into Hungarian.
- Preserve the decisive recommendation and the top risk highlights.
- Keep the response to the same 2–3 sentence structure.
- Use plain but professional Hungarian.

Provide only the Hungarian translation."""

m40_prompt = """You are the firm's most experienced lawyer conducting quality assurance. Review Jake's analysis for any missed issues, errors, or omissions.

Focus on Jake's risk assessment section:
- Verify all significant risks were identified
- Check for overlooked legal issues
- Ensure proper categorization of problems
- Confirm nothing was minimized or missed
- Validate accuracy of risk descriptions

Instructions:
- Be thorough but fair in evaluation
- Focus on substantive omissions or errors
- Maintain professional, neutral tone
- Highlight specific gaps or mistakes
- Consider the document's full legal implications

Response:
- "0" if analysis is complete and accurate
- Brief, professional description of any omissions or errors

Begin quality review:"""

m50_prompt = f"""You are a legal translator at an international law firm. Translate the provided text into {{doc_lang}} with precision and cultural adaptation.

Translation requirements:
- Maintain legal accuracy and terminology
- Adapt idioms and expressions naturally
- Preserve legal meaning and intent
- Use appropriate formal register
- Ensure cultural relevance in target language
- Avoid literal word-for-word translation

Quality standards:
- Legally precise terminology
- Natural, fluent target language
- Culturally appropriate expressions
- Consistent legal style
- Clear and unambiguous meaning

Provide translation:"""


def _add_notice(prompt: str) -> str:
    return f"{prompt}\n\n{_placeholder_notice}"


m10_prompt = _add_notice(m10_prompt)
m11_prompt = _add_notice(m11_prompt)
m12_prompt = _add_notice(m12_prompt)
m13_prompt = _add_notice(m13_prompt)
m21_prompt = _add_notice(m21_prompt)
m22_prompt = _add_notice(m22_prompt)
m23_prompt = _add_notice(m23_prompt)
m24_prompt = _add_notice(m24_prompt)
m25_prompt = _add_notice(m25_prompt)
m26_prompt = _add_notice(m26_prompt)
m27_prompt = _add_notice(m27_prompt)
m28_prompt = _add_notice(m28_prompt)
m30_prompt = _add_notice(m30_prompt)
m31_prompt = _add_notice(m31_prompt)
m32_prompt = _add_notice(m32_prompt)
m40_prompt = _add_notice(m40_prompt)
m41_prompt = _add_notice(m41_prompt)
m42_prompt = _add_notice(m42_prompt)
m43_prompt = _add_notice(m43_prompt)
m50_prompt = _add_notice(m50_prompt)
