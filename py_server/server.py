import os
import openai
import logging
from flask import Flask, request, jsonify, make_response, Response
from flask_cors import CORS
import json
import time

openai.api_key = '<>'
prompt_context = {'role': 'system', 'content': 'please be friendly to the user'}
user_prompt = {'role': 'user', 'content': 'hello, how are you?'}

app = Flask(__name__)
CORS(app)

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Create a stream handler and add it to the logger
handler = logging.StreamHandler()
handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

# Just an example
def chunk_reponse():
    resp = """# Report on Rystad Energy

## Overview

Rystad Energy is a global energy research and business intelligence company that provides data-driven insights to help clients make informed decisions in the energy industry. The company was founded in 2004 and has offices in Norway, the UK, the US, Russia, Brazil, UAE, India, and Singapore.

## Board Members

Rystad Energy is led by a team of experienced professionals who bring a wealth of expertise and knowledge to the company. The board members are:

- Jarand Rystad, Founder and CEO
- Per Magnus Nysveen, Senior Partner and Head of Analysis
- Marius Magnus, Partner and Head of Business Development
- Julie Wilson, Partner and Chief Operating Officer
- Lars Eirik Nicolaisen, Partner and Chief Financial Officer
- Syed Munir Khasru, Independent Board Member

## Industry Summary

The global energy industry is facing significant challenges as the world transitions towards a low-carbon future. The COVID-19 pandemic and the resulting global economic downturn have also had a major impact on the industry.

Despite this, the energy industry continues to play a critical role in powering the global economy. Renewable energy is growing rapidly, driven by falling costs and increased investment. However, oil and gas remain important sources of energy, and demand for these fuels is expected to remain strong in the coming years.

The energy transition is also creating new opportunities for companies that can adapt and innovate. Digital technologies, such as artificial intelligence and blockchain, are transforming the industry and enabling new business models.

## Trends

Some of the key trends shaping the energy industry include:

- Rapid growth in renewable energy, particularly solar and wind power
- Increased investment in energy storage and electrification
- Advancements in digital technologies, including blockchain and artificial intelligence
- Growing demand for energy in emerging economies, particularly in Asia
- Increasing focus on sustainability and carbon emissions reduction
- Greater investment in natural gas, which is seen as a cleaner alternative to coal and oil

Overall, the energy industry is undergoing a significant transformation as it adapts to the challenges of the 21st century. Companies that can innovate and embrace change are likely to thrive in this new energy landscape.""";

    for line in resp.split('\n'):
        time.sleep(0.3)
        yield '{}\n'.format(line)

# This streams each line back to the client
def stream_chat_response(completion):
    buffer = ""
    for chunk in completion:
        try:
            content = chunk["choices"][0]["delta"]["content"]
            buffer += content
            while '\n' in buffer:
                line, buffer = buffer.split('\n', 1)
                yield '{}\n'.format(line)
        except (KeyError, IndexError):
            continue

    if buffer:
        yield buffer

def read_txt(what):
    with open(f'{what}', 'r') as f:
        res = f.read()
    return res

# Takes array of previous messages and adds it to current prompt of messages
def add_prev_messages(request, messages):
    prev = request.json['prev']
    if prev:
        messages.extend(prev)

    return messages

@app.route('/get-prompt-result', methods=['POST'])
def get_prompt_result():
    prompt = """Hello, {}""".format(request.json['prompt'])
    # response = openai.ChatCompletion.create(
    #     model='gpt-3.5-turbo',
    #     messages=[prompt_context, user_prompt],
    #     stream=True
    # )
    return Response(chunk_reponse(), mimetype='text/event-stream')
    #return Response(stream_chat_response(response), mimetype='text/event-stream')

@app.route('/get-industry-prompt', methods=['POST'])
def get_industry_result():
    company = request.json['prompt']

    list_prompt_context = {'role': 'assistant', 'content': 'Summerize requests as reports under 120 words'}
    report_prompt = {'role': 'user', 
        'content': 'Give me an industry summary report for {}.  Include industry trends and other companies that compete with {}.  Format as markdown'.format(company, company)}

    messages = [list_prompt_context, report_prompt]

    messages = add_prev_messages(request, messages)

    response = openai.ChatCompletion.create(
        model='gpt-3.5-turbo',
        messages=messages,
        stream=True
    )

    #Without stream=True
    #return response['choices'][0]['message']['content']
    #With stream=True
    return Response(stream_chat_response(response), mimetype='text/event-stream')

@app.route('/get-company-prompt', methods=['POST'])
def get_company_prompt():
    prev = request.json['prev']
    aboutus_r = read_txt('./data/aboutus_Rystad.txt')
    main_r = read_txt('./data/main_Rystad.txt')

    sys_message = """You are company information extractor."""
    intro = """
    This is text from "About Us" page from Rystard Energy website.
    Detect main values here.
    ###
    """
    intro = """
    What are the main values detected in this text. 
    What are main fields where this company operates?

    Write your answer like this:

    Values:

    fields of operation:

    What kind of product/service they provide:
    Write short and concise answer.
    ###
    """
    messages = [{"role": "user",
                "content": intro +'\n' +main_r  + '\n' + aboutus_r},
            #{"role":"system",
            #"content": sys_message}
            ]
    
    messages = add_prev_messages(request, messages)

    response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0,
            max_tokens=500,
            stream=True,
        )

    return Response(stream_chat_response(response), mimetype='text/event-stream')


@app.route('/get-contact-information', methods=['POST'])
def get_contact_information():
    contact_r = read_txt('./data/contact_Rystad.txt')

    sys_message = """You are company information extractor."""
    intro = """
    extract information about address and contact information
    split the answer into address into and contanct info

    form your answer like this:
    Address Information:

    Contact Information:

    ###
    """
    messages = [{"role":"system",
            "content": sys_message}, 
            {"role": "user",
                "content": intro + contact_r}] 

    messages = add_prev_messages(request, messages)

    response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0,
            max_tokens=500,
            stream=True,
        )

    return Response(stream_chat_response(response), mimetype='text/event-stream')

@app.route('/get-employee-prompt', methods=['POST'])
def get_employee_summary():
    management_r = read_txt('./data/management_Rystad.txt')

    sys_message = """You are company information extractor."""
    intro = """
    Please make me a list of all roles and names in this text
    write first and last name next to the role
    write it in the following format
    Management:
    role - name
    ###
    """
    messages = [{"role": "user",
                "content": intro + management_r},
            {"role":"system",
            "content": sys_message}]

    messages = add_prev_messages(request, messages)

    response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0,
            max_tokens=500,
            stream=True,
        )
    
    return Response(stream_chat_response(response), mimetype='text/event-stream')


@app.route('/get-case-summary', methods=['POST'])
def get_case_summary():
    cases_r = read_txt('./data/cases_Rystad_last_20.txt')
    intro = """
    We are SugarCRM company. These are the latest complaints that our customer, Rystard Energy, had.
    Describe the type of issue mentioned here in a concise way.

    """
    intro_single = "Concisely rewrite this and list the main issues mentioned here, one after another."

    messages = [{"role": "system",
                "content": intro },
            {"role": "user",
                "content": intro_single + cases_r}]  
    
    messages = add_prev_messages(request, messages)
    
    response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0,
            stream=True,
        )
    
    return Response(stream_chat_response(response), mimetype='text/event-stream')

# Used by any card to generate questions based on the previous conversation
@app.route('/questions', methods=['POST'])
def get_questions():
    prev = request.json['prev']
    intro = """
        You read content and come up with questions.
        Questions cannot be longer than 10 words.
        Questions always end with '?'.  
        You do not supply any other text.
        You do not number the questions.
    """
    prompt = """
        Based on this, generate 3 questions about the text.
        Questions cannot be longer than 10 words.
        Do not put any numbers in your response.
    """

    messages = [{'role': 'system', 'content': intro}]
    if prev:
        messages.extend(prev)

    messages.extend([{'role': 'user', 'content': prompt}])

    response = openai.ChatCompletion.create(
        model='gpt-3.5-turbo',
        messages=messages,
    )

    return response['choices'][0]['message']['content']

if __name__ == '__main__':
    app.run(port=3001, debug=True)
