from flask import Flask, render_template, send_from_directory, url_for, redirect
from flask_uploads import UploadSet, IMAGES, configure_uploads
from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed, FileRequired
from wtforms import SubmitField

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dev'
app.config['UPLOADED_PHOTOS_DEST'] = 'uploads'

photos = UploadSet('photos', IMAGES)
configure_uploads(app, photos)

class UploadForm(FlaskForm):
    photo = FileField(
        validators = [
            FileAllowed(photos, 'Only images are allowed'),
            FileRequired('File field should not be empty')
        ]
    )
    submit = SubmitField('Uploads')
    edit = SubmitField('Edit')

@app.route('/edit/show/<filename>')
def edited_image(filename):
    file_url = url_for('get_file', filename = filename)
    return render_template('edit.html', fileUrl = file_url, filename = filename)

@app.route('/save', methods = ['GET', 'POST'])
def save_image():
    return redirect(url_for('upload_image'))

@app.route('/uploads/<filename>')    
def get_file(filename):
    return send_from_directory(app.config['UPLOADED_PHOTOS_DEST'], filename)

@app.route('/', methods = ['GET', 'POST'])
def upload_image():
    form = UploadForm()
    if form.validate_on_submit():
        filename = photos.save(form.photo.data)
        file_url = url_for('get_file', filename = filename)
        print(filename)
    else:
        file_url = None  
        filename = None       
    return render_template('home.html', form = form, file_url = file_url, filename = filename)

if __name__ == '__main__':
    app.run(debug=True)