# Generated by Django 2.2.1 on 2019-05-13 11:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('python_script', '0002_file1'),
    ]

    operations = [
        migrations.CreateModel(
            name='File2',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file2', models.FileField(upload_to='')),
            ],
        ),
    ]
