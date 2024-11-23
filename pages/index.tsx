import Layout from "@/components/Layout/layout";
import { useEffect, useState, useRef } from "react";
import Link from 'next/link';
import { UOMItem, TCardProductItem, ActionItem, TCardOperationItem, TCardItem } from "@/types";

import Image from 'next/image';

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";
import { setActions, setUOMs, setTCards, setTCardCurrent,setTCardCurrentMaterials, setTCardCurrentOperations, setTCardCurrentProducts, settCardCurrentWastes} from '@/store/slices'


import {

} from '@/store/slices';

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");

interface IndexProps {

}

export default function Index({ }: IndexProps) {

  const { push } = useRouter();
  const dispatch = useAppDispatch();


  // mock
  let uoms: { id: number, title: string }[] = [
    { id: 1, title: "шт" },
    { id: 2, title: "литр" },
    { id: 3, title: "лист" }
  ];
  // mock
  let actions: { id: number, title: string }[] = [
    { id: 1, title: "Резка" },
    { id: 2, title: "Обкатка" },
    { id: 3, title: "Сборка" }
  ];

  // mock
  let tCards = [
    {id:100, date:new Date(), number: "100", mode:false},
    {id:150, date:new Date(), number: "150", mode:false},
    {id:1554, date:new Date(), number: "1554", mode:false}, 
  ] as TCardItem[]

  // mock
  let tCardProducts = [
    { id: 1, code: " P1-12-13", qtu: 100, uom: { id: 1, title: "шт" }, mode: false },
    { id: 2, code: " P1-12-13", qtu: 13650, uom: { id: 1, title: "шт" }, mode: false },
    { id: 3, code: " P1-12-13", qtu: 10, uom: { id: 1, title: "шт" }, mode: false }
  ]
   // mock
   let tCardWastes = [
    { id: 1, code: "Обрезки", qtu: 100, uom: { id: 1, title: "шт" }, mode: false },
    { id: 2, code: "Стружка", qtu: 13650, uom: { id: 1, title: "шт" }, mode: false },    
  ]

  let tCardMaterials = [
    { id: 4, code: " P1-12-13", qtu: 100, uom: { id: 1, title: "шт" }, mode: false },
    { id: 5, code: " P1-12-13", qtu: 13650, uom: { id: 1, title: "шт" }, mode: false },
    { id: 6, code: " P1-12-13", qtu: 10, uom: { id: 1, title: "шт" }, mode: false }
  ]

  // mock
  let tCardOperations = [
    {
      id: 1,
      stage: "A",
      out: [
        { id: 1, code: " P1-12-13", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 1, code: " P1-12-13", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 1, code: " P1-12-13", qtu: 10, uom: { id: 1, title: "шт" } }
      ],
      inn: [
        { id: 2, code: "P1-12-13-56-13", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 3, code: "P1-12-13-56-14", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 4, code: "P1-12-167-56-13", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 5, code: "P1-8812-13-568-13", qtu: 10, uom: { id: 1, title: "шт" } }],
      action: { id: 1, title: "резка" },
      duration: 86400000,
      mode: false
    },
    {
      id: 2,
      stage: "A",
      out: [
        { id: 1, code: " P1-12-13", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 1, code: " P1-12-13", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 1, code: " P1-12-13", qtu: 10, uom: { id: 1, title: "шт" } }
      ],
      inn: [
        { id: 2, code: "P1-12-13-56-13", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 3, code: "P1-12-13-56-14", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 4, code: "P1-12-167-56-13", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 5, code: "P1-8812-13-568-13", qtu: 10, uom: { id: 1, title: "шт" } }],
      action: { id: 1, title: "резка" },
      duration: 86400000,
      mode: false
    },

    {
      id: 3,
      stage: "A",
      out: [
        { id: 1, code: " P1-12-13", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 1, code: " P1-12-13", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 1, code: " P1-12-13", qtu: 10, uom: { id: 1, title: "шт" } }
      ],
      inn: [
        { id: 2, code: "P1-12-13-56-13", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 3, code: "P1-12-13-56-14", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 4, code: "P1-12-167-56-13", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 5, code: "P1-8812-13-568-13", qtu: 10, uom: { id: 1, title: "шт" } }],
      action: { id: 1, title: "резка" },
      duration: 122213213213,
      mode: false
    },
    {
      id: 4,
      stage: "B",
      out: [
        { id: 1, code: " P1-12-13", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 1, code: " P1-12-13", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 1, code: " P1-12-13", qtu: 10, uom: { id: 1, title: "шт" } }
      ],
      inn: [
        { id: 2, code: "P1-12-13-56-13", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 3, code: "P1-12-13-56-14", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 4, code: "P1-12-167-56-13", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 5, code: "P1-8812-13-568-13", qtu: 10, uom: { id: 1, title: "шт" } }],
      action: { id: 1, title: "резка" },
      duration: 122213213213,
      mode: false
    },

    {
      id: 5,
      stage: "B",
      out: [
        { id: 1, code: " P1-12-13", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 1, code: " P1-12-13", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 1, code: " P1-12-13", qtu: 10, uom: { id: 1, title: "шт" } }
      ],
      inn: [
        { id: 2, code: "P1-12-13-56-13", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 3, code: "P1-12-13-56-14", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 4, code: "P1-12-167-56-13", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 5, code: "P1-8812-13-568-13", qtu: 10, uom: { id: 1, title: "шт" } }],
      action: { id: 1, title: "резка" },
      duration: 122213213213,
      mode: false
    },
    {
      id: 6,
      stage: "B",
      out: [
        { id: 1, code: " P1-12-13", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 1, code: " P1-12-13", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 1, code: " P1-12-13", qtu: 10, uom: { id: 1, title: "шт" } }
      ],
      inn: [
        { id: 2, code: "P1-12-13-56-13", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 3, code: "P1-12-13-56-14", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 4, code: "P1-12-167-56-13", qtu: 10, uom: { id: 1, title: "шт" } },
        { id: 5, code: "P1-8812-13-568-13", qtu: 10, uom: { id: 1, title: "шт" } }],
      action: { id: 1, title: "резка" },
      duration: 122213213213,
      mode: false
    },
  ];

  useEffect(() => {
    dispatch(setActions(actions))
    dispatch(setUOMs(uoms))
    dispatch(setTCards(tCards))
    dispatch(setTCardCurrent({id:100, date:new Date(), number: "100", mode:false}))
    dispatch(setTCardCurrentProducts(tCardProducts))
    dispatch(settCardCurrentWastes(tCardWastes))
    dispatch(setTCardCurrentOperations(tCardOperations))
    dispatch(setTCardCurrentMaterials(tCardMaterials))
  }, []);


  return (
    <Layout>
      INDEX
    </Layout>
  )
}