::cscript.exe parse.wsf cd-aimp.txt 1 aimp_data CD_AIMP_DATA
::cscript.exe parse.wsf cd-ml.txt 2 aimp_data CD_ML_DATA
::cscript.exe parse.wsf fiio-aimp.txt 1 aimp_data FIIO_X1_DATA
cscript.exe parse.wsf %1 1 aimp_data
