
content = open(r'c:\Users\cvdra\.windsurf\Usta_GO\write_landing_content.html', 'r', encoding='utf-8').read()
with open(r'c:\Users\cvdra\.windsurf\Usta_GO\public\landing.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done:', len(content), 'chars')
