import os
import openai
import logging
from flask import Flask, request, jsonify, make_response, Response
from flask_cors import CORS
import json
import time

openai.api_key = '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'
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

@app.route('/get-prompt-result', methods=['POST'])
def get_prompt_result():
    prompt = """Hello, {}""".format(request.json['prompt'])
    logger.info("""here, {}""".format(prompt))
    response = openai.ChatCompletion.create(
        model='gpt-3.5-turbo',
        messages=[prompt_context, user_prompt],
        stream=True
    )

    #return response
    #return response.choices[0].message.content
    return Response(chunk_reponse(), mimetype='text/event-stream')
    


if __name__ == '__main__':
    app.run(port=3001, debug=True)
