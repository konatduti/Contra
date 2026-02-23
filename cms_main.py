import re
import time
import openai
import sys
from concurrent.futures import ThreadPoolExecutor
import os

from cms_variables import (
    openai_api_key,
    contract_types,
    guides,
    m10_prompt,
    m11_prompt,
    m12_prompt,
    m13_prompt,
    m21_prompt,
    m22_prompt,
    m23_prompt,
    m24_prompt,
    m25_prompt,
    m26_prompt,
    m27_prompt,
    m28_prompt,
    m30_prompt,
    m31_prompt,
    m32_prompt,
    m40_prompt,
    m41_prompt,
    m42_prompt,
    m43_prompt,
    m50_prompt,
    get_model_for_stage,
)

doc_lang = ""
openai.api_key = openai_api_key


def analyze_document(document_text: str, api_key: str, *, store_conversation: bool = True):
    """Run the multi-step contract analysis"""
    global doc_lang
    openai.api_key = api_key

    contract_type_no = 99
    contract_type = ""
    h = "Here is a specific guide for evaluating this contract: "
    request_times = []
    start_time = time.time()

    base_metadata = {"docs": "sample_munkasz", "code": "batch_m2_p", "model": "4.1 - latest"}

    def log_request_time(stage: str, duration: float) -> None:
        request_times.append({"stage": stage, "duration": duration})
        print(f"[Timing] Stage {stage} completed in {duration:.2f}s")
    
    # M10 first and last words, lang variables set
    first_15_words = " ".join(document_text.split()[:15])
    last_15_words = " ".join(document_text.split()[-15:])
    doc_lang = ""
    m10_user = f"""
    First 15 Words: {first_15_words}
    
    Last 15 Words: {last_15_words}
    """
    m12_user = f"""Document: {document_text}"""
    
    m2x_prompts = [m21_prompt, m22_prompt, m23_prompt, m24_prompt, m25_prompt]
    
    # M10 model execution
    start_request = time.time()
    should_store = bool(store_conversation)
    store_option = {"store": True} if should_store else {}

    response_m10 = openai.ChatCompletion.create(
        model=get_model_for_stage("m10"),
        messages=[
            {"role": "system", "content": m10_prompt},
            {"role": "user", "content": m10_user}
        ],
        **({"metadata": {**base_metadata, "m": "10"}} if should_store else {}),        seed=63,
        **store_option
    )
    log_request_time("m10", time.time() - start_request)
    output_m10 = response_m10['choices'][0]['message']['content']
    elapsed_time = time.time() - start_request
    doc_lang = output_m10.strip()
    #print("m10 - Detected Document Language:\n", output_m10)
    #print(f"m10 - Done ({elapsed_time:.2f} seconds)")
    #print("\n\n")
    
    # M11 model execution
    m11_user = f"""Document: {document_text}"""
    
    start_request = time.time()
    response_m11 = openai.ChatCompletion.create(
        model=get_model_for_stage("m11"),
        messages=[
            {"role": "system", "content": m11_prompt},
            {"role": "user", "content": m11_user}
        ],
        **({"metadata": {**base_metadata, "m": "11"}} if should_store else {}),        **store_option
    )
    log_request_time("m11", time.time() - start_request)
    output_m11 = response_m11['choices'][0]['message']['content']
    elapsed_time = time.time() - start_request
    
    # Adjust contract type indexing (m11 might return 0-indexed values)
    contract_type_value = output_m11.strip()
    if not re.fullmatch(r"[0-5]", contract_type_value):
        contract_type_no = 5
    else:
        contract_type_no = int(contract_type_value)

    if not 0 <= contract_type_no < len(contract_types):
        contract_type_no = 5

    contract_type = contract_types[contract_type_no]
    
    #print("m11 - Recognized Contract Type Number:\n", contract_type_no)
    #print("m11 - Recognized Contract Type:\n", contract_type)
    
    # M12 model execution
    start_request = time.time()
    response_m12 = openai.ChatCompletion.create(
        model=get_model_for_stage("m12"),
        messages=[
            {"role": "system", "content": f"{m12_prompt}\n{h}{guides[contract_type][0]}"},
            {"role": "user", "content": m12_user}
        ],
        seed=63,
        **({"metadata": {**base_metadata, "m": "12"}} if should_store else {}),        **store_option
    )
    log_request_time("m12", time.time() - start_request)
    output_m12 = response_m12['choices'][0]['message']['content']
    elapsed_time = time.time() - start_request
    #print(f"m12 - Done ({elapsed_time:.2f} seconds)")
    #print(output_m12)
    #print("\n\n")
    #print("\n\n")
    
    # m13 model execution
    m13_user = f"""Document: {document_text}"""
    
    start_request = time.time()
    response_m13 = openai.ChatCompletion.create(
        model=get_model_for_stage("m13"),
        messages=[
            {"role": "system", "content": m13_prompt},
            {"role": "user", "content": m13_user}
        ],
        seed=63,
        **({"metadata": {**base_metadata, "m": "13"}} if should_store else {}),        **store_option
    )
    log_request_time("m13", time.time() - start_request)
    elapsed_time = time.time() - start_request
    
    output_m13 = response_m13['choices'][0]['message']['content'].strip()
    #print(f"M13 - Extracted Legal References:\n{output_m13}")
    #print(f"M13 - Done ({elapsed_time:.2f} seconds)\n")
    
    # Parse M13 output into a list of legal references
    legal_references = [ref.strip() for ref in output_m13.splitlines() if ref.strip()]
    
    # Print the list of legal references
    #print("\n--- Legal References List ---")
    for idx, ref in enumerate(legal_references, start=1):
        pass
        #print(f"{idx}: {ref}")
    
    
    # M2x models - paralell execution - data
    def call_m2x_api(prompt, idx):
        m2x_user = f"""
    Extracted lines: {output_m12}

    Full document: {document_text}
    """
        start_request = time.time()
        stage = f"m2{idx + 1}"
        response_m2x = openai.ChatCompletion.create(
            model=get_model_for_stage(stage),
            messages=[
                {"role": "system", "content": f"{prompt}"},
                {"role": "user", "content": m2x_user}
            ],
            seed=63,
        **({"metadata": {**base_metadata, "m": f"2{idx + 1}"}} if should_store else {}),            **store_option
        )
        elapsed_time = time.time() - start_request
        log_request_time(stage, elapsed_time)
        output_m2x = response_m2x['choices'][0]['message']['content']
        #print(f"m2{idx + 1} - Done ({elapsed_time:.2f} seconds)")
        #print(output_m2x)
        #print("\n\n")
        return output_m2x
    
    
    # Running M2x requests in parallel
    m2x_outputs = []
    start_request = time.time()
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = [executor.submit(call_m2x_api, prompt, idx) for idx, prompt in enumerate(m2x_prompts)]
        results = [future.result() for future in futures]
    # Collect results and timing
    for output in results:
        m2x_outputs.append(output)

    total_m2x_time = time.time() - start_request
    log_request_time("m2x_batch", total_m2x_time)
    #print(f"Total time for all M2x requests: {total_m2x_time:.2f} seconds")
    m28_user = f"""Analizations: {' | '.join(m2x_outputs)}"""
    
    # m26 model pre
    legal_references = []
    for line in output_m13.splitlines():
        # Remove existing numbering if present (e.g., "1. 2001. évi CII. tv.")
        cleaned_line = line.strip()
        if cleaned_line:
            cleaned_line = cleaned_line.split(". ", 1)[-1]  # Remove leading "1. ", "2. ", etc.
            legal_references.append(cleaned_line)
    
    
    # M26 Function
    def process_m26_reference(ref, retries=3):
        m26_user = f"""
    Full document: {document_text}
    Legal reference: {ref.strip()}
    """
        cleaned_ref = ref.strip()
        for attempt in range(retries):
            try:
                start_request = time.time()
                response_m26 = openai.ChatCompletion.create(
                    model=get_model_for_stage("m26"),
                    messages=[
                        {"role": "system", "content": f"{m26_prompt}"},
                        {"role": "user", "content": m26_user}
                    ],
                    seed=63,
        **({"metadata": {**base_metadata, "m": "26"}} if should_store else {}),                    **store_option
                )
                elapsed_time = time.time() - start_request
                m26_output = response_m26['choices'][0]['message']['content'].strip()
                #print(f"M26 - Processed Reference: {cleaned_ref} | Response: {m26_output}")
                #print(f"M26 - Done ({elapsed_time:.2f} seconds)\n")
                return (cleaned_ref, m26_output)
            except openai.error.RateLimitError:
                wait_time = 2 * (attempt + 1)
                time.sleep(wait_time)
        return (cleaned_ref, "RATE LIMIT ERROR")


    # Run M26 in parallel, using TPE
    m26_responses = []
    if legal_references:
        start_request = time.time()
        max_workers = min(4, len(legal_references))
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(process_m26_reference, ref) for ref in legal_references]
            for future in futures:
                m26_responses.append(future.result())
        total_m26_time = time.time() - start_request
        log_request_time("m26", total_m26_time)

    # Print all M26 results
    #print("\n--- M26 Results ---")
    for idx, (ref, response) in enumerate(m26_responses, start=1):
        #print(f"{idx}. Reference: {ref}")
        #print(f"   M26 Response: {response}\n")
        pass
    
    # m27 models execution

    # Function to process a single invalid legal reference for M27
    def process_m27_reference(ref, m26_response, retries=3):
        m27_user = f"""
    Full document: {document_text}
    Legal reference: {ref.strip()}
    M26 response: {m26_response.strip()}
    """
        for attempt in range(retries):
            try:
                start_request = time.time()
                response_m27 = openai.ChatCompletion.create(
                    model=get_model_for_stage("m27"),
                    messages=[
                        {"role": "system", "content": f"{m27_prompt}"},
                        {"role": "user", "content": m27_user}
                    ],
                    seed=63,
        **({"metadata": {**base_metadata, "m": "27"}} if should_store else {}),                    **store_option
                )
                elapsed_time = time.time() - start_request
                m27_output = response_m27['choices'][0]['message']['content'].strip()
                return (ref.strip(), m26_response.strip(), m27_output)
            except openai.error.RateLimitError:
                wait_time = 2 * (attempt + 1)
                print(f"Rate limit hit. Waiting {wait_time}s before retrying M27 for {ref.strip()}")
                time.sleep(wait_time)
        # If all retries fail
        return (ref.strip(), m26_response.strip(), "RATE LIMIT ERROR")
    
    
    # Filter references where M26 flagged an issue (response != "0")
    invalid_references = [(ref, response) for ref, response in m26_responses if response != "0"]
    
    # Run M27 in parallel, using TPE
    m27_responses = []
    if invalid_references:
        max_workers = min(4, len(invalid_references))
        stage_start = time.time()
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [
                executor.submit(process_m27_reference, ref, response)
                for ref, response in invalid_references
            ]
            for future in futures:
                m27_responses.append(future.result())
        log_request_time("m27", time.time() - stage_start)

    # Print all M27 results
    #print("\n--- M27 Suggestions ---")
    for idx, (ref, m26_response, m27_suggestion) in enumerate(m27_responses, start=1):
        #print(f"{idx}. Reference: {ref}")
        #print(f"   M26 Response: {m26_response}")
        #print(f"   M27 Suggestion: {m27_suggestion}\n")
        pass
    # Prepare the M27 suggestions as a formatted string
    m27_suggestions_summary = "\n".join([
        f"{idx}. Reference: {ref}\n    Assessment: {m26_response}\n   Suggestion: {m27_suggestion}"
        for idx, (ref, m26_response, m27_suggestion) in enumerate(m27_responses, start=1)
    ])
    
    # m28 model execution
    start_request = time.time()
    response_m28 = openai.ChatCompletion.create(
        model=get_model_for_stage("m28"),
        messages=[
            {"role": "system", "content": f"{m28_prompt}"},
            {"role": "user", "content": m28_user}
        ],
        seed=63,
        **({"metadata": {**base_metadata, "m": "26"}} if should_store else {}),        **store_option
    )
    log_request_time("m28", time.time() - start_request)
    output_m28 = response_m28['choices'][0]['message']['content']
    elapsed_time = time.time() - start_request
    #print(f"m28 - Done ({elapsed_time:.2f} seconds)")
    #print(output_m28)
    #print("\n\n")
    #print("\n\n")
    
    # M30 model execution
    m30_user = f"""
    Original document: {document_text}
    Summarized risks: {output_m28}
    Legal reference suggestions: {m27_suggestions_summary}
    """
    start_request = time.time()
    response_m30 = openai.ChatCompletion.create(
        model=get_model_for_stage("m30"),
        messages=[
            {"role": "system", "content": f"{m30_prompt}"},
            {"role": "user", "content": m30_user}
        ],
        seed=63,
        **({"metadata": {**base_metadata, "m": "30"}} if should_store else {}),        **store_option
    )
    log_request_time("m30", time.time() - start_request)
    output_m30 = response_m30['choices'][0]['message']['content'].strip()
    #print("m30:\n", output_m30)
    #print(f"m30 - Done ({request_times[-1]:.2f} seconds)")
    #print("\n\n")
    #print("\n\n")

    # Generate medium and ultra-short summaries (M31 & M32) in parallel
    def run_followup_summary(stage: str, prompt: str, user_content: str) -> str:
        start_request = time.time()
        response = openai.ChatCompletion.create(
            model=get_model_for_stage(stage),
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": user_content},
            ],
            seed=63,
        **({"metadata": {**base_metadata, "m": stage.replace("m", "")}} if should_store else {}),            **store_option,
        )
        log_request_time(stage, time.time() - start_request)
        return response['choices'][0]['message']['content'].strip()

    condensed_inputs = {
        "m31": (m31_prompt, f"Detailed summary for follow-up processing:\n\n{output_m30}"),
        "m32": (m32_prompt, f"Detailed summary for follow-up processing:\n\n{output_m30}"),
    }

    condensed_outputs = {}
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = {
            stage: executor.submit(run_followup_summary, stage, prompt, user)
            for stage, (prompt, user) in condensed_inputs.items()
        }
        for stage, future in futures.items():
            condensed_outputs[stage] = future.result()

    output_m31 = condensed_outputs.get("m31", "").strip()
    output_m32 = condensed_outputs.get("m32", "").strip()

    summaries_en = {
        "detailed": output_m30,
        "normal": output_m31,
        "short": output_m32,
    }

    # Prepare Hungarian translations (M41-M43) in parallel
    def run_translation(stage: str, prompt: str, content: str) -> str:
        start_request = time.time()
        response = openai.ChatCompletion.create(
            model=get_model_for_stage(stage),
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": content},
            ],
            seed=63,
        **({"metadata": {**base_metadata, "m": stage.replace("m", "")}} if should_store else {}),            **store_option,
        )
        log_request_time(stage, time.time() - start_request)
        return response['choices'][0]['message']['content'].strip()

    translation_inputs = {
        "m41": (m41_prompt, f"English detailed summary:\n\n{output_m30}"),
        "m42": (m42_prompt, f"English normal summary:\n\n{output_m31}"),
        "m43": (m43_prompt, f"English ultra-short summary:\n\n{output_m32}"),
    }

    translation_outputs = {}
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {
            stage: executor.submit(run_translation, stage, prompt, user)
            for stage, (prompt, user) in translation_inputs.items()
        }
        for stage, future in futures.items():
            translation_outputs[stage] = future.result()

    summaries_hu = {
        "detailed": translation_outputs.get("m41", "").strip(),
        "normal": translation_outputs.get("m42", "").strip(),
        "short": translation_outputs.get("m43", "").strip(),
    }

    output_m40 = "0"
    # M40 model execution
    if False:
        m40_user = f"""
        Original Document: {document_text}

        The summary needing review: {output}
        """
        start_request = time.time()
        response_m40 = openai.ChatCompletion.create(
            model=get_model_for_stage("m40"),
            messages=[
                {"role": "system", "content": f"{m40_prompt}"},
                {"role": "user", "content": m40_user}
            ],
            seed=63,
        **({"metadata": {**base_metadata, "m": "40"}} if should_store else {}),            **store_option
        )
        log_request_time("m40", time.time() - start_request)
        output_m40 = response_m40['choices'][0]['message']['content']
        elapsed_time = time.time() - start_request
        #print(f"m40 - Done ({elapsed_time:.2f} seconds)")
    #print("\n\n")
    #print("\n\n")
    
    if output_m40 == "0":
        #print("m40 gave back 0")
        pass
    else:
        #print("so sorry, m40 failsafe activated, dont yet know how to proceed")
        #print("m40 gave back: ", output_m40, "process terminated")
        sys.exit(40)
      
    
    # M50 model execution (kept for compatibility)
    m50_user = f"""
    Translated Output Language: {doc_lang}
    Text needing translation: {output_m30}
    """

    start_request = time.time()
    response_m50 = openai.ChatCompletion.create(
        model=get_model_for_stage("m50"),
        messages=[
            {"role": "system", "content": f"{m50_prompt}"},
            {"role": "user", "content": m50_user}
        ],
        seed=63,
        **({"metadata": {**base_metadata, "m": "50"}} if should_store else {}),        **store_option
    )
    log_request_time("m50", time.time() - start_request)
    output_m50 = response_m50['choices'][0]['message']['content']
    elapsed_time = time.time() - start_request
    #print("m50:\n", output_m50)
    #print(f"m50 - Done ({elapsed_time:.2f} seconds)")
    #print("\n\n")

    # final output to user
    # print(ouput_m50)


    # Final runtime and total API request time
    end_time = time.time()
    total_runtime = end_time - start_time
    total_api_time = sum(
        entry["duration"]
        for entry in request_times
        if not entry["stage"].endswith("_batch")
    )
    #print(f"Total runtime: {total_runtime:.2f} seconds")
    #print(f"Total API request time: {total_api_time:.2f} seconds")

    return {
        "contract_type": contract_type,
        "detected_language": doc_lang,
        "summary": summaries_en.get("normal", ""),
        "summary_doc_language": output_m50,
        "summary_detailed_en": summaries_en.get("detailed", ""),
        "summary_normal_en": summaries_en.get("normal", ""),
        "summary_short_en": summaries_en.get("short", ""),
        "summary_detailed_hu": summaries_hu.get("detailed", ""),
        "summary_normal_hu": summaries_hu.get("normal", ""),
        "summary_short_hu": summaries_hu.get("short", ""),
        "summaries": {
            "en": summaries_en,
            "hu": summaries_hu,
        },
        "elapsed_time": total_runtime,
        "api_request_time": total_api_time,
        "per_stage_request_times": request_times,
    }
