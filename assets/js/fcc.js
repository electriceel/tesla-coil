/* ============================================================================
   FCC grant records for the fobs named in the vehicle seed.

   Every entry was checked against the public FCC equipment-authorization
   record. Only what the FCC certifies is stored: who holds the grant, the
   equipment class, the operating frequency, and the ORIGINAL grant date.

   Original, not latest. A grant accumulates Class II permissive changes -- a
   later tweak to an already-certified radio -- and a lookup page shows the most
   recent one by default. Read that way GQ43VT20T looks like 2012 and a 2004
   Sienna looks impossible; its original grant is 2002-09-30 and the Sienna is
   perfectly ordinary. Five entries here moved earlier once that was fixed.

   Vehicle fitment is deliberately NOT in this file. The FCC certifies a radio,
   not a model year -- the "fits 2012-2017 Camry" line on a lookup site is a
   marketplace listing, not part of the grant. Fitment lives on the vehicle
   record, where it can be corrected from the bench.

   One row per FCC ID, joined to the vehicle at render time. The same fob is on
   eight Fords; its frequency should not be written eight times and get eight
   chances to disagree with itself.

   Worth having because the frequency tells you what to expect on a sniffer
   before you cut anything, and the grantee tells an OEM fob from a clone.

   Checked 2026-09-15. An FCC ID absent from this file has not been verified, and
   tests/fcc.test.js fails the build rather than let an unchecked one ship.
   ============================================================================ */
const FCC_GRANTS = {
  'ABO1502T': { mfr:'General Motors Corporation-Corporate Affairs-VEFE', klass:'Remote Keyless Entry System', freq:'315 MHz', granted:'1995-01-11' },
  'ACJ932HK1210A': { mfr:'Panasonic Corporation of North America', klass:'SMART FOB', freq:'313.85 MHz', granted:'2011-12-23' },
  'CWTWB1G0090': { mfr:'ALPS ALPINE CO., LTD.', klass:'Hand Unit', freq:'433.92 MHz', granted:'2017-03-23' },
  'CWTWB1U212': { mfr:'ALPS ALPINE CO., LTD.', klass:'Automotive Security System Transmitter', freq:'315 MHz', granted:'1997-01-28' },
  'CWTWB1U331': { mfr:'ALPS ALPINE CO., LTD.', klass:'Automobile Security System', freq:'314.5-315.5 MHz', granted:'2001-09-18' },
  'CWTWB1U345': { mfr:'ALPS ALPINE CO., LTD.', klass:'Vehicle remote keyless entry transmitter', freq:'315 MHz', granted:'2006-12-11' },
  'CWTWB1U733': { mfr:'ALPS ALPINE CO., LTD.', klass:'Transmitter Assy-Lock System Remote Control', freq:'315 MHz', granted:'2006-03-31' },
  'CWTWB1U751': { mfr:'Alps Electric Co., Ltd.', klass:'Remote Keyless Entry', freq:'315 MHz', granted:'2007-04-18' },
  'CWTWB1U793': { mfr:'Alps Electric Co., Ltd.', klass:'Key Fob', freq:'315 MHz', granted:'2009-10-23' },
  'CWTWB1U808': { mfr:'Alps Electric Co., Ltd.', freq:'314.975 MHz', granted:'2010-02-24' },
  'CWTWB1U821': { mfr:'Alps Electric Co., Ltd.', klass:'Remote Keyless Entry Transmitter', freq:'315 MHz', granted:'2010-05-26' },
  'CWTWB1U840': { mfr:'Alps Electric Co., Ltd.', freq:'314.975 MHz', granted:'2012-02-15' },
  'GQ4-29T': { mfr:'TRW Inc', klass:'Key Transmitter', freq:'315 MHz', granted:'2007-06-07' },
  'GQ4-53T': { mfr:'TRW Inc', klass:'Vehicle Keyfob', freq:'433.9 MHz', granted:'2012-07-18' },
  'GQ43VT14T': { mfr:'BCS Access Systems US LLC', klass:'3VT14T', freq:'315 MHz', granted:'1998-02-23' },
  'GQ43VT20T': { mfr:'TRW Inc', klass:'Automotive Remote Control', freq:'315 MHz', granted:'2002-09-30' },
  'HYQ12BBX': { mfr:'Denso Corporation', klass:'Remote Keyless Entry Transmitter', freq:'314.35 MHz', granted:'2002-10-24' },
  'HYQ14AAB': { mfr:'Denso Corporation', klass:'Keyless Entry Vehicle Transmitter', freq:'315 MHz', granted:'2004-06-29' },
  'HYQ14ACX': { mfr:'Denso Corporation', klass:'Electronic Key', freq:'314.35 MHz', granted:'2007-11-05' },
  'HYQ14ADR': { mfr:'Denso Corporation', klass:'Electronic Key', freq:'314.35 MHz', granted:'2009-01-22' },
  'HYQ14AHC': { mfr:'Denso Corporation', klass:'Electronic Key', freq:'314.35 MHz', granted:'2013-07-11' },
  'HYQ14AHK': { mfr:'Denso Corporation', klass:'Electronic Key', freq:'433.92 MHz', granted:'2015-06-18' },
  'HYQ14FBA': { mfr:'Denso Corporation', klass:'Electronic Key', freq:'312.1 MHz', granted:'2010-06-04' },
  'HYQ14FBB': { mfr:'Denso Corporation', klass:'Electronic Key', freq:'312.1 MHz', granted:'2014-09-25' },
  'HYQ14FBC': { mfr:'Denso Corporation', klass:'Electronic Key', freq:'312.1 MHz', granted:'2015-02-23' },
  'HYQ14FBF': { mfr:'Denso Corporation', klass:'Electronic Key', freq:'312.1 MHz', granted:'2015-12-17' },
  'HYQ14FBX': { mfr:'Denso Corporation', klass:'Electronic Key', freq:'312.1 MHz', granted:'2019-09-02' },
  'HYQ14FLA': { mfr:'Denso Corporation', klass:'Electronic Key', freq:'312.1 MHz', granted:'2019-10-24' },
  'HYQ2AB': { mfr:'Denso Corporation', klass:'Electronic Key', freq:'314.9 MHz', granted:'2012-12-26' },
  'HYQ4EA': { mfr:'Denso Corporation', klass:'Electronic Key', freq:'433.92 MHz', granted:'2013-11-01' },
  'HYQ4ES': { mfr:'Denso Corporation', klass:'Electronic Key', freq:'433.92 MHz', granted:'2019-05-30' },
  'IYZ-C01C': { mfr:'Marquardt GmbH', freq:'433.92 MHz', granted:'2009-01-12' },
  'IYZ3312': { mfr:'Marquardt GmbH', klass:'Security Device Transmitter', freq:'314.5-315.5 MHz', granted:'2000-04-26' },
  'IYZFBSB802': { mfr:'Marquardt GmbH', klass:'Transmitter', freq:'315 MHz', granted:'2007-10-25' },
  'KBRTN001': { mfr:'Marelli Corporation', klass:'Keyless Entry System Transmitter', freq:'315 MHz', granted:'2004-06-23' },
  'KOBDT04A': { mfr:'Lear Corporation', klass:'Keyless Remote', freq:'315 MHz', granted:'2003-03-10' },
  'KR55WK48801': { mfr:'Continental Automotive GmbH', klass:'Radio frequency transmitter', freq:'433.589-434.251 MHz', granted:'2009-02-20' },
  'KR55WK48903': { mfr:'Continental Automotive GmbH', klass:'Transmitter', freq:'315 MHz', granted:'2006-07-04' },
  'KR55WK49127': { mfr:'Continental Automotive GmbH', klass:'Key', freq:'315 MHz', granted:'2006-03-10' },
  'KR55WK49308': { mfr:'Continental Automotive GmbH', klass:'Transmitter', freq:'313.85 MHz', granted:'2007-03-06' },
  'KR55WK49622': { mfr:'Continental Automotive GmbH', klass:'Keyless Car Entry', freq:'315 MHz', granted:'2007-08-07' },
  'KR5S180144014': { mfr:'Continental Automotive GmbH', klass:'Keyless Entry System', freq:'433.92 MHz', granted:'2011-09-20' },
  'KR5TP-4': { mfr:'Continental Automotive GmbH', klass:'Radio', freq:'433.92 MHz', granted:'2020-06-19' },
  'KR5TXN4': { mfr:'Continental Automotive GmbH', klass:'Radio', freq:'433.92 MHz', granted:'2018-04-19' },
  'KR5TXN7': { mfr:'Continental Automotive GmbH', klass:'Radio', freq:'433.92 MHz', granted:'2018-08-07' },
  'KR5V1X': { mfr:'Continental Automotive GmbH', klass:'Transmitter', freq:'313.55-314.15 MHz', granted:'2013-03-12' },
  'KR5V2X': { mfr:'Continental Automotive GmbH', klass:'Transmitter', freq:'433.66-434.18 MHz', granted:'2013-04-15' },
  'LHJ011': { mfr:'Continental Automotive Systems, Inc.', klass:'Wireless Car Remote Transmitter', freq:'315 MHz', granted:'2002-02-07' },
  'M3N-32337100': { mfr:'Continental Automotive Systems US Inc.', klass:'Transmitter', freq:'314.9 MHz', granted:'2012-12-04' },
  'M3N-32337200': { mfr:'Continental Automotive Systems US Inc.', klass:'Transmitter', freq:'433.92 MHz', granted:'2012-12-04' },
  'M3N-40821302': { mfr:'Continental Automotive Systems US Inc.', klass:'Auto Entry/Remote Start Transmitter', freq:'433.9 MHz', granted:'2010-12-06' },
  'M3N-97395900': { mfr:'Continental Automotive Systems, Inc.', klass:'RKE Tx', freq:'433.92 MHz', granted:'2015-10-21' },
  'M3N-A2C31243300': { mfr:'Continental Automotive Systems US Inc.', klass:'Automobile Entry/Security Transmitter', freq:'902.375 MHz', granted:'2012-04-17' },
  'M3N-A2C931426': { mfr:'Continental Automotive Systems, Inc.', klass:'RKES Transmitter', freq:'902.375 MHz', granted:'2015-12-03' },
  'M3N-A3C054339': { mfr:'Continental Automotive Systems, Inc.', klass:'RKE Transceiver', freq:'902.375 MHz', granted:'2020-03-03' },
  'M3N5WY7777A': { mfr:'Continental Automotive Systems US Inc.', klass:'Automobile Security Transmitter', freq:'315 MHz', granted:'2007-05-01' },
  'M3N5WY8406': { mfr:'Continental Automotive Systems US Inc.', klass:'Auto Security/Entry Transmitter', freq:'315 MHz', granted:'2008-04-03' },
  'M3N5WY8406A': { mfr:'Continental Automotive Systems US Inc.', klass:'Auto Security/Entry Transmitter', freq:'315 MHz', granted:'2008-04-03' },
  'MLBHLIK6-1T': { mfr:'Honda Lock Mfg. Co., Ltd.', klass:'Transmitter of Keyless Entry', freq:'313.85 MHz', granted:'2012-02-06' },
  'MOZB21TG': { mfr:'Tokai Rika Co Ltd', freq:'312.15 MHz', granted:'2003-03-14' },
  'N5F-A08TAA': { mfr:'Valeo Comfort and Driving Assistance', freq:'314.95 MHz', granted:'2012-04-16' },
  'N5F-S0084A': { mfr:'Valeo Comfort and Driving Assistance', klass:'Transmitter S0084A', freq:'313.85 MHz', granted:'2005-06-20' },
  'NBG009768T': { mfr:'Hella KGaA Hueck & Co.', klass:'Keyless Car Entry', freq:'314.9 MHz', granted:'2008-11-12' },
  'NBG010180T': { mfr:'Hella KGaA Hueck & Co.', klass:'Keyless Car Entry', freq:'315 MHz', granted:'2009-08-26' },
  'NBGFS12A01': { mfr:'HELLA GmbH & Co. KGaA', klass:'Keyless Car Entry', freq:'315 MHz', granted:'2012-11-05' },
  'NBGIDGNG1': { mfr:'HELLA GmbH & Co. KGaA', klass:'Radio Indentification Device', freq:'433.2-434.64 MHz', granted:'2013-04-05' },
  'OHT-4882056': { mfr:'Strattec Security Corporation', klass:'RKE Transmitter', freq:'433.92 MHz', granted:'2017-07-19' },
  'OHT01060512': { mfr:'Strattec Security Corporation', klass:'Keyless Entry', freq:'315 MHz', granted:'2009-12-14' },
  'OHT1130261': { mfr:'Strattec Security Corporation', klass:'Vehicle Security and Entry System', freq:'433.92 MHz', granted:'2017-06-07' },
  'OHT692427AA': { mfr:'Strattec Security Corporation', klass:'RKE Transmitter', freq:'315 MHz', granted:'2005-05-08' },
  'OSLOKA-360T': { mfr:'Omron Automotive Electronics Korea Co., Ltd.', freq:'313.85 MHz', granted:'2010-05-10' },
  'OSLOKA-875T': { mfr:'Omron Automotive Electronics Korea Co., Ltd.', klass:'RF Keyless Entry System Transmitter', freq:'433.92 MHz', granted:'2013-03-20' },
  'OUC60221': { mfr:'OMRON Automotive Electronics Co. Ltd.', klass:'Remote Control Transmitter', freq:'315 MHz', granted:'2010-03-24' },
  'OUC60270': { mfr:'NIDEC MOBILITY CORPORATION', klass:'Remote Control Transmitter', freq:'315 MHz', granted:'2004-12-09' },
  'OUCG8D-380H-A': { mfr:'NIDEC MOBILITY CORPORATION', klass:'Automotive Security Transmitter', freq:'313.8-313.9 MHz', granted:'2002-02-13' },
  'OUCG8D-387H-A': { mfr:'NIDEC MOBILITY CORPORATION', klass:'Automotive Security Transmitter', freq:'313.85 MHz', granted:'2002-08-12' },
  'OUCG8D-399H-A': { mfr:'NIDEC MOBILITY CORPORATION', klass:'Keyless Entry Remote Control Transmitter', freq:'313.85 MHz', granted:'2004-01-30' },
  'OUCJ166N': { mfr:'NIDEC MOBILITY CORPORATION', klass:'Transmitter of Keyless Entry System', freq:'315 MHz', granted:'2015-04-21' },
  'SY5HMFNA04': { mfr:'Continental Automotive Systems Corporation', klass:'Smart Key Fob', freq:'315 MHz', granted:'2008-03-07' },
  'SY5JFFGE04': { mfr:'Continental Automotive Systems Corporation', klass:'Smart Key Fob', freq:'433.92 MHz', granted:'2015-01-13' },
  'SY5MQ4FGE04': { mfr:'Continental Automotive Systems Corporation', klass:'Smart Key Fob', freq:'433.92 MHz', granted:'2019-11-01' },
  'TQ8-FOB-4F03': { mfr:'HYUNDAI MOBIS CO., LTD.', klass:'Remote Keyless Entry', freq:'433.92 MHz', granted:'2013-02-08' },
  'TQ8-FOB-4F11': { mfr:'HYUNDAI MOBIS CO., LTD.', klass:'Remote Keyless Entry', freq:'433.92 MHz', granted:'2015-08-20' },
  'TQ8-FOB-4F19': { mfr:'HYUNDAI MOBIS CO., LTD.', klass:'Fob Smart Key', freq:'433.92 MHz', granted:'2017-12-14' },
  'TQ8-FOB-4F24': { mfr:'HYUNDAI MOBIS CO., LTD.', klass:'Fob Smart Key', freq:'433.92 MHz', granted:'2018-07-05' },
  'TQ8-FOB-4F27': { mfr:'HYUNDAI MOBIS CO., LTD.', klass:'Fob Smart Key', freq:'433.92 MHz', granted:'2018-11-23' },
  'WAZSKE13D01': { mfr:'Mitsubishi Electric Corporation Himeji works', klass:'Keyless System Hand Unit', freq:'315 MHz', granted:'2011-03-28' },
  'YGOG21TB2': { mfr:'Huf Huelsbeck & Fuerst GmbH & Co. KG', klass:'B2 Passive Entry Keyfob', freq:'433.2-434.64 MHz', granted:'2019-05-08' },
};

if (typeof module !== 'undefined') module.exports = { FCC_GRANTS };
