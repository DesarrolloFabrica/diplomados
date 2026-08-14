export type CategoriaRecurso =
  | "video"
  | "documento"
  | "infografia"
  | "podcast"
  | "presentacion";

export interface LeccionEnlaces {
  leccion: string;
  recursos: Record<CategoriaRecurso, string>;
}

export interface ModuloEnlaces {
  modulo: string;
  lecciones: LeccionEnlaces[];
}

/** Mapa explícito módulo → lección → categoría lógica → URL Google Drive. */
export const ENLACES_GERENCIA_SOCIAL: ModuloEnlaces[] = [
  {
    modulo: "Aspectos conceptuales de gerencia social",
    lecciones: [
      {
        leccion: "Principios de la gerencia social",
        recursos: {
          video: "https://drive.google.com/file/d/1HcHgxGF6Q51HgKEEC2omebAqElg-PG7h/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1_vV-1vvdZQyLuEbGArH2m8BPJ2yp0bc3/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/10WJipKH7t0kz6c3ZMPbBHBNpLPjFuQ6m/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1EhhPX9Dl7eOAwU-Kv2y1o9w3pbTaf907/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1qUxoFWGxOC9QhpkxiVcFiyojxGdNl9Ax/view?usp=drivesdk",
        },
      },
      {
        leccion: "Objetivos de la gerencia social",
        recursos: {
          video:
            "https://drive.google.com/file/d/1nTLXcuZ7OTkq4FYwzwp3pR8yX5wrA8uJ/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1otJQalmrkTH-BX8kHltenE_BDMmZ8bwE/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1u5WLFU-EChpU4AJ_A3ciGuSmYN1rfZ5U/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1UWcNL0mx9gltOQxR__peDjBv3zpwSNpB/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/15J5sisciG-Inyos1MdQufXt17Fqfl7Cv/view?usp=drivesdk",
        },
      },
      {
        leccion: "Generalidades de la gerencia social",
        recursos: {
          video:
            "https://drive.google.com/file/d/1WIBy_jofw-VDNXChxziuq3l8cQ-6LOPP/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/18Ns_f0wIe0bMPeMaBVr0LjRDUFhUFwQC/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1WvTu-l6EBSVE5ZfXN101pl1v1CKbYuTi/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1tg8fIOGKmTcnZVYCLmSaUwsfqlfKURij/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1hQFEpWBSdUdFCvyEygyWuACdCzj9v03L/view?usp=drivesdk",
        },
      },
      {
        leccion: "Puntos de encuentro con la gerencia pública y el sector productivo",
        recursos: {
          video:
            "https://drive.google.com/file/d/11XuCSx7nlqnkddlCAnaGHklaV3SeoAG1/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1t4G8brhgEYCmjCIGKD-zoerkL8udfRns/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1Mw1NBde-3ThCKpF11o51v4Hbr0nrGJlb/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1a_uFVsBUADSZ5qBQ1dZLK25b8bpxX0sZ/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1PZ3tZR-pgNo97USzE4qTkJdJiE7nxOzz/view?usp=drivesdk",
        },
      },
      {
        leccion: "Generación de valor público e identificación de valores propios",
        recursos: {
          video:
            "https://drive.google.com/file/d/18GTGFQJ6mN6zqjZFeBPo7bVfnldfb08C/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1PrbNY2IZ4Z0VQ5LzgLEhPt2esFOG9tBh/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/12QFmbOpB_SNs6zTc_SekjkPNoGaiMu0w/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1wqxC2SdoRTzoT-H_y_q0wH41jglfedIY/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1AVF3XqPSTE0Ov7IVfA8GpjYKSjrQk8vy/view?usp=drivesdk",
        },
      },
      {
        leccion: "Características de la organización",
        recursos: {
          video:
            "https://drive.google.com/file/d/1_Cwj54iQIr2KTg2ZTMbbc-D0bp8gc4oq/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1KGhVEehly7s5W_qjJpyR6a2at6S_jW4d/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1lUHdEYx6-_hcbxhjCsh50i1YTDXBT4Fj/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/12YVzBR8R0qxmnMn3FHctaD5j70_1fcaN/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1UF5-QYNN_l1IC6MgaA-7qvCT_XgqYJlR/view?usp=drivesdk",
        },
      },
    ],
  },
  {
    modulo: "Herramientas para la gerencia social",
    lecciones: [
      {
        leccion: "Análisis de involucrados",
        recursos: {
          video:
            "https://drive.google.com/file/d/1ANNjz5vAwEukRETmviXFjsDPKwty-ac9/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/13fSNI01QQHihR8IeFuXmS0zPJ1xeEwGI/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1NoXc2MLAWIH4u067hoGLb8Wj5nHBU7Sp/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1SECQEoMG80QFVUcWKBuKP-x-0D4bMSQS/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1PCyUb-7xQZegL-UhWD2RHi73ckb1DfbU/view?usp=drivesdk",
        },
      },
      {
        leccion:
          "Técnicas de manejo de conflictos y herramientas de comunicación efectiva",
        recursos: {
          video:
            "https://drive.google.com/file/d/1xjZCEfytfHpyZaNXkgvc4SGe0IhqBNLr/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1GKm4NsmKH4efe0JQBOIXdIwNeP8KoKdi/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1nQmxVa9gfAJAetr3WPvRIdJ1SZauaEzo/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1RYP2wN3EdK-ToWGjq3jEjyu4Obnl3gRG/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1Ib5oP0Qv7zzhZKJ9jaDD0LHz2XQizH73/view?usp=drivesdk",
        },
      },
      {
        leccion: "Metodología para promover la participación",
        recursos: {
          video:
            "https://drive.google.com/file/d/1ve-QISRcTwdLswMVruXc66fe49V3BopQ/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1bzUi1ins_N-7_Sp9Q9WH9nRo8K38iEY-/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1MJ8S8KGL2k41cYIu5BaK0AfyDGs4E1kc/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1ABhGikjNUu4Ha2KUk9M_9abEtWNuiVkf/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1FeW1l2qV4m-0t4kgkDs-rMgEUJa-Jnst/view?usp=drivesdk",
        },
      },
      {
        leccion: "Herramientas de planificación estratégica",
        recursos: {
          video:
            "https://drive.google.com/file/d/1JXQKWBIQ3bRdZzU-InPHX-l43CG4ddt6/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/11yWTxqOzWwHkTDfM34_8WR6cHPBQdhJV/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1tq9H2LNfaNsmLqxu6HMBjs7BMD-ZsiIB/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1n2wXraFAwSNhN2-IHNYhoH4CA-In6v2g/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1eVycnWTb7S8HIbCjKJ3MHh5xJZn0Ayh-/view?usp=drivesdk",
        },
      },
      {
        leccion: "Herramientas de evaluación de impacto",
        recursos: {
          video:
            "https://drive.google.com/file/d/17lOofHUvLY3JuOTPvofCHVPB-2iktclP/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/11CrrzguZJoianzllOZ1nbh6v60WH23J8/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1d8FH7dJJqIgLR0a3wokatTji37HT5KXw/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1LNnz-l_fhcfZnfHBsaudu7mSJr7nkSj7/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1QubgsyBO6-WCNZxxhd57ddAkVWMYZzSa/view?usp=drivesdk",
        },
      },
      {
        leccion: "Herramientas de gestión de proyectos, monitoreo y seguimiento",
        recursos: {
          video:
            "https://drive.google.com/file/d/1f4w-S8KHenhMLuHUYVck_Apa7-1j-IQT/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1MtVX7mio5zxfP5XP-0J2D68Td5jHYmFh/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1ohDJXExb8Q7Qc1et2yjCqxZhtxLpsiZ3/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/178zCa9KTALt1Vn3xAi5sueJtxJ5G15Oo/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1KJidxxy6ltR5sHQnpl8uQmrWVK6Z585o/view?usp=drivesdk",
        },
      },
      {
        leccion: "Herramientas de participación comunitaria",
        recursos: {
          video:
            "https://drive.google.com/file/d/1AZXdBQGQEH7rfY9npSqiXlv-49ipIgFS/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1EX52rd7JxjzE1Fr28mHaXAYCKb7WIyr0/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1g4bltMWyrgV8xnQhbo6-wYG2rJkSvlfz/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1iOS7u2pkZLOFFIP51VhtB0qLfEoYCx4R/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1EEYmydF4EsyPcpAmBkhRsK9APFwknCZG/view?usp=drivesdk",
        },
      },
      {
        leccion: "Herramientas de gestión del cambio y aprendizaje organizacional",
        recursos: {
          video:
            "https://drive.google.com/file/d/1L6wX7Lnij2yClmNit8VpoWWeJp0Rae-q/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1aZY2cKLDRGaz3DQYrPpS1ylFV-XeVYeF/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1pRWEBdy0kleP1T807e1kxajNwpV9ZRfp/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1pt8Bgp-zcUO_buJFTpWrnRoMpepEJhLP/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1-I10MVJ5QJ7z1DyDuAgU4Hb2CcBZDoB3/view?usp=drivesdk",
        },
      },
    ],
  },
  {
    modulo: "Responsabilidad social y empresarial",
    lecciones: [
      {
        leccion: "Plan integral de gestión en el ámbito social",
        recursos: {
          video:
            "https://drive.google.com/file/d/1KdR9i2kpOrCrRg-bp5PDb2Qjafi1NORX/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1YTwyZM1r4OEE4uMCbPio81tVUbG73KbP/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1jZjqCJdnuPVIUiPGYG2362MSkV2QUo8x/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1kUzJPU1ym7QNUdV5xS8oNg3UbbiopdfR/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1VbF6qV8-_vQnlLI545vmSByn77tiR-wD/view?usp=drivesdk",
        },
      },
      {
        leccion: "Análisis de las necesidades de la comunidad",
        recursos: {
          video:
            "https://drive.google.com/file/d/1cmZgbdK8fZqcQnd-JI8sEf8CsgINOF1j/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1vs7QRtrVn1ewgTNzq2GAdE_ZkmOF3IPf/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1TWqVy9y7VPnfwDHCqlTU8e05SCQB4atD/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1ze7_cMPuMkGF1dEL1iqlCLOUq89QVQaI/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/104_mv9qbrL3IKem1RWfgQxbWy2F-CdTe/view?usp=drivesdk",
        },
      },
      {
        leccion: "Definición de objetivos y metas sociales",
        recursos: {
          video:
            "https://drive.google.com/file/d/19xn3MWjYxWgD9-jIQAPMye_jue1KpqMv/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1JQ5MhVpMcfIdcDyGcvAiuHweLPEFR6Aj/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1g5D07hFcAr350WVcIHLBNGalpCwoPAWe/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1e1il7GYZQDxi7Hbz9y-EwDVjUze-Voth/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1rp57XMxUcNjtWYdq1rwutAz44o-SoK2R/view?usp=drivesdk",
        },
      },
      {
        leccion: "Estrategias de participación comunitaria",
        recursos: {
          video:
            "https://drive.google.com/file/d/1Qlp2PpnT5jbJmsHsIsuGGAPUf2dQfZCt/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1HNc4G-jMQDc48vs4BvFV6-l8gVrXtwco/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1hs7eSa3xFb4C675HjJdKH7XSbkJgGbQP/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1lgfziC1ermMQPsnE7GWxE3bEKiciKISe/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1a__NWx29RYhCqg1nU7hfHz7LN4n4NaLr/view?usp=drivesdk",
        },
      },
      {
        leccion: "Desarrollo de alianzas estratégicas",
        recursos: {
          video:
            "https://drive.google.com/file/d/1X6ffefXwrOkVO7Gr9ltBTdfwt5D2ppSh/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1O5EKhh_fxKJJykcari6oaul5uSGR9CSD/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/17kbfeo2VXGJy8D9ryQuyYWqXcWAKA3O_/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1xcs8laId4_dClOgUYCTsMU09lorXysIf/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1-G5IdWBifD0APqi4tJn7SpfQBWdyUIbi/view?usp=drivesdk",
        },
      },
      {
        leccion: "Implementación de programas de sostenibilidad social",
        recursos: {
          video:
            "https://drive.google.com/file/d/1imVLB7tiluOxTeCrv8nkwMmnxrOsmY2F/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1X8uIlWKAOOQeakKpAUDG6bDBrGvrRaxY/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1-qIgrdE91ApqUhSe4JwN6p31-Kli2OT-/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1S9uAjZPp3KVeFI9rJ8IY_rxDfxoPPQFb/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1ICmldwiIwy0PVTLGpQnFAE7sbSVEU_HH/view?usp=drivesdk",
        },
      },
      {
        leccion: "Monitoreo y evaluación del impacto social",
        recursos: {
          video:
            "https://drive.google.com/file/d/1_Nj46Jr1QP9gt-E4wQQcz4Z2p_JFZcGo/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1cNb2wgrlEb4eYkZCbOxnskcHIJHj3pJN/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1CYSaWKAoawO4U1j6NWmkMpAWmuRRxXv1/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1ZS90DamPFjAFjXI_YFB6l7ZCKErQ00hW/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1GCTNPpJz5U8wsXjVwsuStvPQIo-2sz_B/view?usp=drivesdk",
        },
      },
      {
        leccion: "Adaptabilidad y ajuste del plan",
        recursos: {
          video:
            "https://drive.google.com/file/d/1-FDYVE-J-hGupRkWPtD2v-RREsTtXc5_/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1ygfcpM0AVmEP0KdXEJry91t6OUHsFnau/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1iXOvhpvRWiqv4C20j8ZXj8zfKqZgXDbR/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/103I_XQ8vLFmceUHUmTpVF7EEylDVDNlO/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1xtuvU1JpHTYTbb6a9r4kOD8ZU3A0LvyA/view?usp=drivesdk",
        },
      },
    ],
  },
  {
    modulo: "Responsabilidad social y conflictos sociales",
    lecciones: [
      {
        leccion: "Conflicto social",
        recursos: {
          video:
            "https://drive.google.com/file/d/1nbN1lgU8Ch8D5nddIIpVhHAGy_BdLeYD/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1C8c8uTRFDkP28awtRf4prJ0--V1GeriQ/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1ZaQPgo-id8YRYVqv3Qs3AjobmK-1Vt5N/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1FyFuMI11jihetTafcbVbBlkBf-IVrAfu/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/11EhsLL-tEpzqYoU5bX0dKnzgA5lFHOiu/view?usp=drivesdk",
        },
      },
      {
        leccion: "Áreas de enfoques de la RSE",
        recursos: {
          video:
            "https://drive.google.com/file/d/1iaT5meMTyY2GpCBvMLFLmMVe5cwWjd99/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1qMTtBjQ_2HB29kqPDyU67OVYbkIW5KvE/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1lsx3YU44m81wiwnJN_YNe4rS1K8QVecE/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1vd0CCKLk0jV8uCeLwy6Bpro8_NR6FJW5/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1SH0T0VvZlNtWumKk985IOADjJP8IvssU/view?usp=drivesdk",
        },
      },
      {
        leccion: "Retos y desafíos de la RSE",
        recursos: {
          video:
            "https://drive.google.com/file/d/1_H_9i3iq6S-_xwryvvyTQMZN63pEWpwS/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/18qu2Znmk-wJZnI7xKEAfqA0EYU4VubWa/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/10UU9QTefSr1FBmAKNHz8PnMZhCIXzkh4/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1Cqsb0qJZWnj6kS5DsZTZaliiW586sOSW/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1dOBCMvANUyi81I3g2c0dzCzdh7hUVnpW/view?usp=drivesdk",
        },
      },
      {
        leccion: "Relación entre empresas y conflictos sociales",
        recursos: {
          video:
            "https://drive.google.com/file/d/1WR4hA8kfLAOcn0Vb75XZqXCF6Fyetbz9/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1HhSuB88dB6hKo-u2s-lTX-7lbTH1yNiW/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1xCWEB99-GePWuZBtIkbPtpGFaZ03UFYH/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/18d-oatCDNpsEXVpophPwrveZSo80Th04/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/15bxfnmwQCV_t7DhhhTmZoS1XS_KP7tb_/view?usp=drivesdk",
        },
      },
      {
        leccion: "Impacto de los conflictos sociales en las empresas",
        recursos: {
          video:
            "https://drive.google.com/file/d/1Os-hS-KuJTvym_X9haqcb2Fi2VBjKIx_/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1LwjoNb5o6dO5k17T6trhtKO8BR9zW9vF/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/17GSlAly6hv88rF7EXfZmNmm4ETLMaXDf/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1LXVaFpp7BdWbtN8vYPhPtpcxqvJU1993/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1cyiPgdJdTxde4_LQs6TEamNB2EkLSpHH/view?usp=drivesdk",
        },
      },
      {
        leccion: "Estrategias para abordar los conflictos sociales",
        recursos: {
          video:
            "https://drive.google.com/file/d/1G8YfPC_1TvOxccFHY0RDIaOCxjmE6snv/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1eAdsWJ-1_5HJOLYGs_RyspTdJ77X3T_i/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1DUr5vLvqZmd0kr2_DmHS2wYUypnokMX_/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1ALlbVgWdDC_ZTHMlhv9I7cab10sP1mTF/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1ewnpOsRkPJxZh4UfZEAW1C-VxDu-i61W/view?usp=drivesdk",
        },
      },
      {
        leccion: "Medición y evaluación de la RSE",
        recursos: {
          video:
            "https://drive.google.com/file/d/12gYRPGeg3uOCG3A1ia_DICJF0nkrNYQM/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1F3giW5eRKABHIdBb3GSap7hfcuklU0Pb/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1uzCBLizsm5GfH4xQOj46QMnCOrzX8ael/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1YQicUcqUbomaPQvI0SJsl_y4BwQiUd50/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/13hW_8fwb4Dvikt6qOTZKs-YCXrlKsCem/view?usp=drivesdk",
        },
      },
      {
        leccion: "Estrategias emergentes desde la responsabilidad social",
        recursos: {
          video:
            "https://drive.google.com/file/d/1cbOd3aBDf4uXeGTQQoN3uct3z0JE4wAO/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1NUHaAlnv1NwjlhgothRGLMGjUDz3AHAw/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1iZTx-ROinRXMOb2PhDTp-lByDgA3z6Ew/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1WGXS_Xt4TiMqya1EfV9Ky6DzTwjyWw9A/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1-QJy3NqOyPjF_ICx_xoLew4sBvt0VW4K/view?usp=drivesdk",
        },
      },
    ],
  },
  {
    modulo: "Responsabilidad social y construcción de paz",
    lecciones: [
      {
        leccion: "Importancia de la responsabilidad social en la construcción de paz",
        recursos: {
          video:
            "https://drive.google.com/file/d/1N1FJtfvkL55ZxoNtj0W1ltUyoYBS3xrD/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1U1ZbJFtNvDN-wtyTvSdhbR_gNXZMdaTJ/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1o-3E_9dZfe2Ki3R8SYkF8IQW8MD_B9_6/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1ILRNwhDzZizCkrdkm9Js4GOierwhZveN/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1WMO3Y7eBAfdROBlA7Of9e2mTZmEOJM_a/view?usp=drivesdk",
        },
      },
      {
        leccion: "Iniciativas de responsabilidad social para la paz",
        recursos: {
          video:
            "https://drive.google.com/file/d/1wECfca-3wLHicZY68SZ7SYyMgZ_gsfv6/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1lyobl4lZuxESrPwo1AZ-GPgaYN5zbiip/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1PAI861hhXLmENsR3IaoWh7pQBsyrFrZl/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1d8cHj8CwqqqlOSKDMchBLxDAkhzfSkv-/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1yG7XktHKMC8p9lWQaXgH8ih0Mjo5UDY3/view?usp=drivesdk",
        },
      },
      {
        leccion:
          "Desafíos y obstáculos en la implementación de responsabilidad social para la paz",
        recursos: {
          video:
            "https://drive.google.com/file/d/1oA1kpmlQCL0SbmYv1kq3RpQWflj-Sxp9/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1RavswjmbhlPVuEUhEU0qdI_4TAsaIBgC/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/19DxF1hKZOBv3qCfkaHLn3fhoG-7UdsZZ/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1USZq3jgZ9uICUwCult7iDkBL7IoNTP8r/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1oCWjk8S768rieJKF4sJh0nDYyGiN5sh9/view?usp=drivesdk",
        },
      },
      {
        leccion: "Integración de la responsabilidad social y la construcción de paz",
        recursos: {
          video:
            "https://drive.google.com/file/d/1bUo3pIc3R44GFHQVNz1wLjo4mFBIsbU0/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1ahcoqtmAYk7axhd-XMvc1Ok689urcJTK/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/18GexKY650nQFEe1G6otTcghrF7A6tCpQ/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1qq2gEBV_EmpWwlapdTtsf25hS5YsUQVm/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1WtKa3OSMeEljMybXsG3WXTK0nEiUjIBw/view?usp=drivesdk",
        },
      },
      {
        leccion:
          "Recomendaciones para fomentar la responsabilidad social en la construcción de paz",
        recursos: {
          video:
            "https://drive.google.com/file/d/1fNuA3xSRrKLFgH_MkENwUlXKJJyMgm19/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1VWaqQNPAqG3lwWXhYfEWZIROxQM4DnuN/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/1KLGHODJojgP4zzovy4rJgUpm4NfLmCsz/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1Z4-y_YnjJQAiG-I6xDuzKH0MMwak3jSF/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/139cyoqWMGzR4j11UF19GtKCCMZesQQ_F/view?usp=drivesdk",
        },
      },
      {
        leccion: "Construcción de paz en la perspectiva de la gerencia social",
        recursos: {
          video:
            "https://drive.google.com/file/d/1aXYhEXDNGtUjCeMcLerVI_SkEQ6PaTR6/view?usp=drivesdk",
          documento:
            "https://drive.google.com/file/d/1s5Tx7DSi6eAYoB_SPTF_d8qVGUKPkqYW/view?usp=drivesdk",
          infografia:
            "https://drive.google.com/file/d/17AVHxLBDFUuPUeMMifOA8cKUunpC6CGv/view?usp=drivesdk",
          podcast:
            "https://drive.google.com/file/d/1g_C_FM4P4UjQaWDlVjitqg3yQa3gNBry/view?usp=drivesdk",
          presentacion:
            "https://drive.google.com/file/d/1INLSRu1c6zVFCrEGd3L2M7Tu70bgBpU4/view?usp=drivesdk",
        },
      },
    ],
  },
];

export const CATEGORIAS: CategoriaRecurso[] = [
  "video",
  "documento",
  "infografia",
  "podcast",
  "presentacion",
];
