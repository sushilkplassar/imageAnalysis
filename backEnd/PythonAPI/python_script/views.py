from rest_framework.parsers import FileUploadParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
import cv2
import os
from PIL import Image
import tensorflow as tf
from .serializers import FileSerializer
from .serializers import FileSerializer1
from .serializers import FileSerializer1
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from .models import File
import json, io
import urllib.request as req


class FileUploadView(APIView):
    parser_class = (FileUploadParser,)

    def post(self, request, *args, **kwargs):
        print(request.POST)
        data = json.loads(request.POST['data'])
        print(type(data))
        print(data)
        print(data[0])
        finlay = {}
        CATEGORIES = ["control", "mutant"]

        for i in range(len(data)):
            id_list = list(data[i].keys())
            id_list.remove('exp_img_id')
            Prediction1 = []

            for j in range(len(data[i][id_list[0]])):
                imgurl = data[i][id_list[0]][j]['link']
                req.urlretrieve(imgurl, "./media/" + str(j) + ".jpg""")
                model = tf.keras.models.load_model("./training_model_file/64x3-CNN.model")
                print("Before Prediction..")
                prediction = model.predict([prepare("./media/" + str(j) + ".jpg""")])

                print(prediction)  # will be a list in a list.s

                # print(CATEGORIES[int(prediction[0][0])])

                Prediction1.append(CATEGORIES[int(prediction[0][0])])
                # data[i]['batch'] = data[i].pop(id_list[0])

            print(Prediction1)

            if 'mutant' in Prediction1:
                data[i]['type'] = 'mutant'
                final = 'mutant'
                print("Final Prediction: " + final)
            else:
                data[i]['type'] = 'control'
                final = 'control'
                print("Final Prediction: " + final)

        # print("Final Prediction: " + final)

        # print(Prediction1)

        return Response(data, status=status.HTTP_201_CREATED)


def prepare(filepath):
    IMG_SIZE = 224
    img_array = cv2.imread(filepath, cv2.IMREAD_GRAYSCALE)
    new_array = cv2.resize(img_array, (IMG_SIZE, IMG_SIZE))
    return new_array.reshape(-1, IMG_SIZE, IMG_SIZE, 1)
