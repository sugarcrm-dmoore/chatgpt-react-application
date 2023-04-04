# Flask Server with OpenAI Integration

This repository contains a Flask server that integrates with the OpenAI API to generate text based on user prompts. The server listens on port 3001 and accepts prompts from a web form.

## Installation

Clone this repository to your local machine.

```bash
git clone https://github.com/sugarcrm-dmoore/chatgpt-react-application.git
```

Navigate to the project directory.
```bash
cd ./py_server
```

Install the required Python packages using pip.
```bash
pip install -r requirements.txt
```

Set the OPENAI_API_KEY environment variable to your OpenAI API key.
```bash
server.py line:9 openai.api_key = '[YOUR_KEY]'
```

##Usage

Start the Flask server using the following command:
```bash
python server.py
```
Open your web browser and navigate to http://localhost:3001.

##License

This project is licensed under the MIT License - see the LICENSE file for details.

##Acknowledgments

This project was inspired by the OpenAI API and the Flask web framework.