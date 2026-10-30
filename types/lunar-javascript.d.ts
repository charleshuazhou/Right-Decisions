declare module "lunar-javascript" {
  export const Solar: {
    fromYmd(year: number, month: number, day: number): SolarDate;
    fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number,
    ): SolarDate;
  };

  export const Lunar: {
    fromYmd(year: number, month: number, day: number): LunarDate;
    fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number,
    ): LunarDate;
  };

  interface SolarDate {
    toYmd(): string;
    getLunar(): LunarDate;
  }

  interface LunarDate {
    toString(): string;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getYearInGanZhi(): string;
    getMonthInGanZhi(): string;
    getDayInGanZhi(): string;
    getSolar(): SolarDate;
    getEightChar(): EightChar;
    getDayYi(): string[];
    getDayJi(): string[];
    getDayJiShen(): string[];
    getDayXiongSha(): string[];
    getPengZuGan(): string;
    getPengZuZhi(): string;
    getZhiXing(): string;
    getDayPositionXi(): string;
    getDayPositionCai(): string;
    getDayPositionFu(): string;
    getDayChong(): string;
    getTimes(): LunarTime[];
  }

  interface LunarTime {
    getGanZhi(): string;
    getYi(): string[];
    getZhi(): string;
  }

  interface EightChar {
    setSect(sect: number): void;
    toString(): string;
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
    getYearNaYin(): string;
    getMonthNaYin(): string;
    getDayNaYin(): string;
    getTimeNaYin(): string;
    getYearShiShenGan(): string;
    getMonthShiShenGan(): string;
    getDayShiShenGan(): string;
    getTimeShiShenGan(): string;
    getYearHideGan(): string;
    getMonthHideGan(): string;
    getDayHideGan(): string;
    getTimeHideGan(): string;
    getYun(gender: number): Yun;
  }

  interface Yun {
    getStartYear(): number;
    getStartMonth(): number;
    getStartDay(): number;
    getStartSolar(): { toYmd(): string };
    getDaYun(): DaYun[];
  }

  interface DaYun {
    getGanZhi(): string;
    getStartYear(): number;
    getEndYear(): number;
    getStartAge(): number;
    getEndAge(): number;
    getLiuNian(): LiuNian[];
  }

  interface LiuNian {
    getYear(): number;
    getGanZhi(): string;
    getAge(): number;
  }
}
