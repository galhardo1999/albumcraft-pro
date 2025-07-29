Crie uma pagina Chamada de Fotos

Criar no Administrador a Galeria de fotos no navbar e que ele possa fazer upload de fotos de eventos, organizadas em álbuns, e disponibilizá-las de forma seletiva para usuários específicos. Os usuários autorizados poderão visualizar e baixar essas fotos.

Fluxo do Administrador (Backend/Painel Admin):

Gerenciamento de Eventos:

Deve haver uma nova área no painel chamada "Galerias de Fotos".

Nesta área, o Admin poderá Criar, Editar e Excluir Eventos.

Ao criar um evento, o Admin deve informar:

Nome do Evento (obrigatório)

Upload de Mídia e Criação de Álbuns:

Dentro de um evento criado, o Admin terá a opção de "Adicionar Álbuns/Fotos".

O sistema deve permitir o upload de uma pasta principal.

A lógica será:

O nome da pasta principal é ignorado.

Cada subpasta dentro dela se tornará um Álbum. O nome da subpasta será o nome do Álbum.

Todas as imagens (.jpg, .png, .jpeg, .cr2, .cr3, .raw) dentro de uma subpasta pertencerão ao respectivo álbum.

O sistema deve exibir um status de progresso durante o upload e processamento.

Associação de Usuários:

Na página de edição do Evento, o Admin deve poder associar um ou mais usuários que terão acesso a essa galeria.

Deve haver um campo de busca para encontrar e adicionar usuários pelo nome ou e-mail.

O Admin deve poder remover o acesso de um usuário a qualquer momento.

Fluxo do Usuário (Frontend/Dashboard):

Acesso à Galeria:

No dashboard do usuário, na seção "Ações Rápidas”, uma opção "Fotos Disponíveis”.

Condição de Visibilidade: Este item SÓ deve ser visível se o usuário tiver pelo menos um evento de fotos associado a ele. Caso contrário, o link não aparece.

Visualização dos Eventos:

Ao clicar em "Fotos Disponíveis", o usuário é levado a uma página que exibe todos os eventos aos quais ele tem acesso.

Cada evento será representado por um card visual.

O card do evento deve conter:

O nome do evento.

Visualização dos Álbuns e Fotos:

Ao clicar em um card de evento, o usuário entra na página daquele evento.

A página exibirá os álbuns como uma grade de pastas/cards menores. Cada card de álbum deve mostrar o nome do álbum.

Ao clicar em um álbum, o usuário verá uma grade com as miniaturas (thumbnails) de todas as fotos daquele álbum.

Clicar em uma miniatura deve abrir a foto em tela cheia (modal ou lightbox) com setas para navegar entre as fotos do mesmo álbum.

Funcionalidade de Download:

Na visualização de um álbum (grade de miniaturas), deve haver um botão para "Baixar Álbum Completo" (que fará o download de um arquivo .zip com todas as fotos do álbum).