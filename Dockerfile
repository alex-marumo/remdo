FROM ubuntu:latest
ARG DEV_USER

RUN  apt-get update \
  && apt-get install -y wget \
  && apt-get install -y git \
  && rm -rf /var/lib/apt/lists/*
RUN groupadd -r ${DEV_USER} \
  && useradd -r -g ${DEV_USER} ${DEV_USER}

#RUN mkdir -p /home/${DEV_USER} \
#  && chown -R ${DEV_USER}:${DEV_USER} /home/${DEV_USER}
#VOLUME /home/${DEV_USER} 
#VOLUME [ "/data1" ]

#RUN chown -R ${DEV_USER}:${DEV_USER} /data1
#RUN mkdir /data2 && chown ${DEV_USER}:${DEV_USER} /data2

RUN wget -O- https://aka.ms/install-vscode-server/setup.sh | sh

USER ${DEV_USER}

RUN echo && echo && echo "run code-server to finish installation" echo && echo
