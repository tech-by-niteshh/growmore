import os
import zipfile

os.makedirs('downloads', exist_ok=True)

# 1. Create GrowMore-App-Package.zip
zip_path = os.path.join('downloads', 'growmore-app.zip')
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for f in ['index.html', 'app.html', 'style.css', 'app.js', 'manifest.json']:
        if os.path.exists(f):
            zipf.write(f, f)
    launcher = "@echo off\r\necho Starting GrowMore Live Demo...\r\nstart \"\" \"%~dp0index.html\"\r\n"
    zipf.writestr('Launch-GrowMore.bat', launcher)
    readme = "GrowMore Fintech Interactive Demo\r\nDouble-click Launch-GrowMore.bat to start instantly in your browser.\r\n"
    zipf.writestr('README.txt', readme)

# 2. Create demo APK
apk_path = os.path.join('downloads', 'growmore.apk')
with zipfile.ZipFile(apk_path, 'w', zipfile.ZIP_DEFLATED) as apk:
    apk.writestr('AndroidManifest.xml', b'<?xml version="1.0" encoding="utf-8"?><manifest package="in.growmore.app"></manifest>')
    apk.writestr('assets/app.html', open('app.html', 'rb').read())
    apk.writestr('assets/style.css', open('style.css', 'rb').read())
    apk.writestr('assets/app.js', open('app.js', 'rb').read())
    apk.writestr('META-INF/MANIFEST.MF', b'Manifest-Version: 1.0\r\nCreated-By: GrowMore Engine\r\n')

print("Created packages:", os.listdir('downloads'))
