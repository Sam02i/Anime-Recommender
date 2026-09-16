import { useState, useEffect, useRef, useMemo } from "react";

const API = "http://localhost:5000";

const DEMO_RECS = [
  { Name: "Steins;Gate", Score: 9.17, Episodes: 24, Genres: "Sci-Fi, Thriller, Drama", Synopsis: "A self-proclaimed mad scientist discovers a way to send messages to the past, triggering catastrophic consequences that unravel reality itself.", similarity_score: 0.95, Image_URL: "https://cdn.myanimelist.net/images/anime/5/73199.jpg" },
  { Name: "Fullmetal Alchemist: Brotherhood", Score: 9.11, Episodes: 64, Genres: "Action, Adventure, Drama", Synopsis: "Two brothers use alchemy to attempt to resurrect the dead and pay a devastating price, embarking on a journey to restore what was lost.", similarity_score: 0.93, Image_URL: "https://cdn.myanimelist.net/images/anime/1223/96541.jpg" },
  { Name: "Vinland Saga", Score: 8.80, Episodes: 24, Genres: "Action, Adventure, Historical", Synopsis: "A Viking bent on revenge slowly discovers that true strength has nothing to do with fighting. A saga of war, revenge, and peace.", similarity_score: 0.92, Image_URL: "https://cdn.myanimelist.net/images/anime/1500/103005.jpg" },
  { Name: "Monster", Score: 8.78, Episodes: 74, Genres: "Mystery, Psychological, Drama", Synopsis: "A surgeon saves a boy's life and loses everything — then spends years hunting the monster he created across post-Cold War Europe.", similarity_score: 0.91, Image_URL: "https://cdn.myanimelist.net/images/anime/10/18793.jpg" },
  { Name: "Mob Psycho 100", Score: 8.70, Episodes: 37, Genres: "Action, Comedy, Supernatural", Synopsis: "The most powerful psychic alive just wants to grow as a person. His overwhelming powers are the least interesting thing about him.", similarity_score: 0.90, Image_URL: "https://cdn.myanimelist.net/images/anime/8/80356.jpg" },
  { Name: "Hunter x Hunter", Score: 9.05, Episodes: 148, Genres: "Action, Adventure, Fantasy", Synopsis: "Hunters devote themselves to accomplishing hazardous tasks. A boy chases the dream of finding his missing father and uncovers a world far darker than imagined.", similarity_score: 0.88, Image_URL: "https://cdn.myanimelist.net/images/anime/11/33657.jpg" },
  { Name: "Code Geass", Score: 8.72, Episodes: 50, Genres: "Action, Mecha, Sci-Fi", Synopsis: "An exiled prince with the power to command anyone uses it to tear down an empire, walking a razor's edge between justice and tyranny.", similarity_score: 0.87, Image_URL: "https://cdn.myanimelist.net/images/anime/5/50331.jpg" },
];

// ── ATLAS WORLD MAP DATA (static, generated once via d3-geo equirectangular
// projection at build time — no mapping library needed at runtime) ──────
const WORLD_MAP_PATH = "M334.5,472.3L332.9,475L315.9,472.9ZM57.8,470.8L45.2,468.3L52.1,467.7ZM374.6,466.8L379.6,472.3L359.8,475.1L350,472.8L358.4,471.2L364.8,466.8ZM163.3,454.2L163.3,454.2L163.3,454.2ZM151.2,454.1L151.2,454.1L151.2,454.1ZM225.1,449.8L225.1,449.8L225.1,449.8ZM309.9,447.1L308.9,450.5L293.9,451L304.9,441.3ZM0,485.3L0,485.3L0,485.3L2.6,483.7L15.6,484.8L27.9,483L36.1,484.9L60.9,487.1L68.9,486.4L87.4,487.8L103.1,484.9L83.2,484.2L73.4,482.5L75.4,477.9L64.3,475.3L81.5,475.9L92.3,472L68.5,469.6L61,466.7L64,464.7L79.6,465L94.2,462.4L99.1,459.8L124.4,456.4L167.5,456.9L183.5,454.8L201.2,458.8L220.4,459.2L212,451.7L232.4,454.5L254.4,452.8L273.7,455.1L277,453.1L288.3,455.5L312.9,451.3L309.8,444.7L311.8,437L325,429.6L337.2,426.1L336,428.8L326.4,430.8L327.4,433.9L318,437.7L329.1,447.5L331.4,453.2L327.9,456.8L303.9,462.9L285.4,463.1L293.7,465.4L283.5,467.7L290.7,472.9L334.2,478.8L338.3,481.2L361.8,477L381.1,478L420.7,473.2L417.5,470.2L401,470.7L400.6,467.6L419.8,463L437.6,461.4L456.4,456.9L454.3,455.2L471.4,448L480.9,447L499.4,449L526.5,444.5L530,446.8L537.3,444.4L553.5,444.1L562.7,446.4L581,445L594.1,440.3L607.4,443.8L611.2,442L635.4,438.2L656.5,433.3L663.2,436.9L673.3,438.9L677.9,437.2L691.4,438.7L693.2,443.6L688.7,449.6L697.3,450.2L705.2,444.1L715.7,443L729.9,436.7L741,436.5L744.4,433.9L751.7,436.7L777,436.8L785.6,432.1L794.9,435.9L815.6,433L821.1,435.3L835.7,436.6L839.8,434.9L857.8,435.4L874.3,433.9L881.8,436L904.1,435.9L907.3,438.6L923.6,441.3L928.6,440.4L951.9,446.5L967.9,447.1L975.6,449.2L970.2,454.6L956.2,459.6L954.1,464.1L963.9,468.8L949.3,469.9L943.9,474.9L954.7,478.9L981.2,484.5L995.2,484.6L1000,485.3L1000,500L500,500L0,500ZM311.8,399.6L319.3,401.9L310.7,404.5L302.8,402.9L292.6,396.8L302.5,400.2L309.4,396.2ZM337.4,391.9L337.4,391.9L337.4,391.9ZM695.2,388.1L695.2,388.1L695.2,388.1ZM903.9,363.3L911.9,363.5L910.9,370L905.7,371ZM980.6,363.7L984,366L970.4,379.6L963,378.4L964,375.3ZM985,350.4L995.9,354.7L988.9,364.7L982.8,359.7ZM964.2,311.6L964.2,311.6L964.2,311.6ZM995.5,298.2L995.5,298.2L995.5,298.2ZM1000,296L998.2,296.7L998.4,295.5L1000,294.6L1000,296ZM0,294.6L0,294.6L0,296L0,296L0,296L0,294.6ZM966.2,295.7L966.2,295.7L966.2,295.7ZM964.2,291.5L964.2,291.5L964.2,291.5ZM639,287.7L640.2,292.3L630.8,319.3L622.3,319.4L620.1,311.3L623.3,305.8L623.5,295L632.5,290.5L636.7,283.4ZM898.8,288.2L903.8,291.6L906.6,302.7L913.5,306.6L915.8,312.1L924.6,320.2L926.6,328.1L924.7,337.9L916.7,354L906.4,358.4L890.7,355.6L887.7,350.4L877.7,346.9L873,340.6L864.8,337.5L850.4,339.5L843.5,344.1L833,344.4L827.8,347.4L819.5,345L821.7,339.5L815,317.7L817.1,310.4L835.7,304.7L841.7,295.6L853,288.4L856.6,291.3L867.7,280.9L880.4,284.3L876.2,290.9L886.8,298.3L891.3,298.2L895.9,279.6ZM950.3,279.1L950.3,279.1L950.3,279.1ZM835.3,278.4L835.3,278.4L835.3,278.4ZM946.8,277.4L946.8,277.4L946.8,277.4ZM949.1,276.7L949.1,276.7L949.1,276.7ZM845.7,278.2L845.7,278.2L845.7,278.2ZM827.5,272.5L827.5,272.5L827.5,272.5ZM841.4,272.5L841.4,272.5L841.4,272.5ZM944.1,273.2L944.1,273.2L944.1,273.2ZM937.6,270.4L937.6,270.4L937.6,270.4ZM801.7,268.8L807.7,268L821.4,273.3L818.2,274.3L792.7,269L794.6,266.4ZM874.2,267.3L874.2,267.3L874.2,267.3ZM933,268.9L933,268.9L933,268.9ZM922.2,265.2L917.3,267.5L912.2,265.1ZM853.5,259.6L853.5,259.6L853.5,259.6ZM862.4,258.6L862.4,258.6L862.4,258.6ZM925.4,262.5L925.4,262.5L925.4,262.5ZM872.6,253.2L876.3,259.4L884.2,254.7L901.6,260.7L913.1,275.3L918.9,278.6L910.9,278.1L902.1,271.2L896.2,275.9L885.2,270.3L883.1,265L871.3,259.8L862.6,252.6ZM847.9,246.1L845.7,248.8L833.8,249.3L842.1,264.8L834.2,258.1L834.5,265.4L829.9,257.8L835.8,246.4ZM857.5,246.9L857.5,246.9L857.5,246.9ZM793.9,266.3L785,261.7L773.9,244.9L764.9,236.2L770.8,235.4L779.6,244.2L788.4,249.7L794.7,258.5ZM827.4,244.9L822.6,261.1L806.2,258.2L803,251.3L804.6,244.4L808.8,244.9L825.4,230.8L831.1,235L825.9,241ZM851,226.6L848.3,234.5L843.4,228.2ZM725.6,232.8L723.2,233.4L722.6,222.7L727.2,229.1ZM330.7,221.9L330.7,221.9L330.7,221.9ZM844.4,221.4L844.4,221.4L844.4,221.4ZM829.2,224.1L829.2,224.1L829.2,224.1ZM838.6,217L838.6,217L838.6,217ZM848.6,216.2L848.6,216.2L848.6,216.2ZM837.6,213.7L837.6,213.7L837.6,213.7ZM837,198.6L840.3,202.5L838.1,210.2L833.5,208.4ZM317.8,199.4L317.8,199.4L317.8,199.4ZM286.4,200.4L286.4,200.4L286.4,200.4ZM298.4,194.8L310.2,198.3L300.8,199.9ZM806.5,198.1L806.5,198.1L806.5,198.1ZM67.9,197L67.9,197L67.9,197ZM66.5,192.7L66.5,192.7L66.5,192.7ZM64.6,191.2L64.6,191.2L64.6,191.2ZM62.1,190.8L62.1,190.8L62.1,190.8ZM57.4,188.9L57.4,188.9L57.4,188.9ZM278.7,186.8L294,193.7L284,194.8L281.3,190L270.1,187ZM284.6,184L284.6,184L284.6,184ZM836.6,186.7L836.6,186.7L836.6,186.7ZM283.8,176.2L283.8,176.2L283.8,176.2ZM286.1,176.1L286.1,176.1L286.1,176.1ZM874,155.1L874,155.1L874,155.1ZM596,150.9L596,150.9L596,150.9ZM565.8,150.8L565.8,150.8L565.8,150.8ZM543.1,143.8L541.9,148.3L534.5,145.5ZM525.6,135.5L525.6,135.5L525.6,135.5ZM891.6,146.8L889.6,152.4L863.8,155.9L864.8,162.6L859.5,157.5L868.4,151.6L876.9,151.3L887.3,143.8L889.7,135.6L894.1,141.2ZM526.6,132.9L526.6,132.9L526.6,132.9ZM899.7,127.3L904.3,129.8L897.7,133.3L893.4,131.4L894.4,123.5ZM323.2,120.7L323.2,120.7L323.2,120.7ZM328.3,113.6L328.3,113.6L328.3,113.6ZM156.9,115.3L151,114.4L143.5,109L150.7,110.3ZM344.1,109.2L351.5,113.2L353.8,118L335.4,117.8L342.4,107.5ZM131.4,99.9L131.4,99.9L131.4,99.9ZM899,109L898.7,119.9L894.7,122.3L896.1,100.7ZM481.1,104.8L472.3,106.1L473.1,100.3L479,96.9L484.3,98.5ZM535.2,95.5L535.2,95.5L535.2,95.5ZM75,91.3L75,91.3L75,91.3ZM491.7,87.1L494.2,94.7L501.3,103L501.5,109L484,110.7L488,107.7L489.9,98.3L482.9,92.3L486.1,87.1ZM40.1,83.6L40.1,83.6L40.1,83.6ZM279.8,77.3L279.8,77.3L279.8,77.3ZM272.5,75.8L272.5,75.8L272.5,75.8ZM23,72.8L23,72.8L23,72.8ZM263.4,67.6L277.5,73L269.1,71.9L262.4,74.9ZM459.7,65.4L462.2,69.1L448.2,73.6L432.4,67.7ZM289.3,63.5L289.3,63.5L289.3,63.5ZM636.4,135.3L636.7,145.6L649.5,147.3L647,136.5L652,136.2L639.7,126.1L647.3,124.3L642.2,119.3L629.7,126.1ZM1000,69.5L1000,69.5L992.8,70.5L998.3,75L982.4,78.7L973.1,83.7L969.2,81.7L954.3,83.7L950.3,97.6L945.5,99L935.5,108.3L931.8,96.2L935.6,89.4L939.9,88.7L954.6,80.2L956.9,76.2L944.8,81.8L942.5,78.4L935.3,79.4L928.4,84L895,86L875.3,98L892.6,102.5L889.1,115.4L874.6,129.5L867.4,129.8L854.3,139.6L859.6,147.8L858.6,152.5L851.3,154.5L850.5,145.1L845.2,139.1L836.3,142L837.9,136.3L826.5,142.4L836.4,148.2L831,153L838.6,162L839.1,167.1L829.6,181.8L821.9,186.7L807.7,190.6L801.4,189.7L793.5,197.1L802.4,207.6L803.3,217.6L792.1,226.1L791.9,222.4L778,212.8L775.4,222.3L779.1,229.4L787.2,236.5L787.6,246.6L781.6,242.3L776.4,229.6L772.6,226.8L774.3,218.2L769.9,203L761.6,205.5L762,199.4L753.9,186.8L741.6,190.3L723.1,205.8L721.8,221.2L715.4,227.9L712.8,225.3L704.3,205.6L701.7,190.7L695.7,192L684.4,179.4L670.8,180.3L659.4,178.5L656.9,174.6L652,176.4L643.1,172.6L639.2,166.3L633.3,166.7L635.6,173.1L643.9,183.3L650,183L656.6,176.7L656.7,180.8L666.1,188L660.5,197L653.5,202.1L635.2,211.1L620.8,214.9L618.5,203.4L608.7,190.9L608.5,187.3L597.6,172L590.9,170.3L602.4,188.9L604.1,198.3L609.1,205.8L620.3,215.6L622.5,221L642,216.6L637.4,231.1L629.3,242.1L611.8,257.1L607.8,268L612.4,279.9L613.3,290.8L609.6,296.4L596.6,305L598.8,311.4L597.3,318L591.7,320.4L590.2,328.6L578.4,341L571.6,344.3L562.7,344.1L554.5,346.7L550.7,344.1L550.6,338L542.3,325.3L539.6,311.4L532.3,296.3L537.9,283.4L536.8,273.8L533.1,264L524.4,253.1L527.2,241.5L523.6,236.7L516.4,238.2L512,232.6L494.5,236.9L488.9,235.6L479.1,237.9L464,228.3L458.8,219.8L453.9,216.2L451,209.1L454.3,205.2L454.8,194.2L452.6,191.7L459.9,177.1L473.4,166.9L476,157.7L483.5,150.7L494,152.3L504.1,148.3L526.4,146.2L530.9,157.5L542.3,160.4L553,165.9L557.9,159.1L580.3,164.3L595.2,163.3L600.4,150.5L596.4,147.8L590.3,149.7L576.8,148.2L572.7,140.4L581.2,135.5L597.7,133.2L606.5,136.3L615.4,134.6L615.1,131.5L601.9,124.3L608.7,118.7L599.5,120.4L601.5,123.7L594.1,126.8L593.3,122.6L585.4,120.6L576.9,131.7L580,136L563.4,137.6L566.7,143.8L560.2,147.7L553.9,138.2L554.3,134.1L536.5,123L535,127.5L551,137.9L544.7,144.5L542.8,138.8L535.8,135.4L524.7,126.8L518.1,130.2L508.6,130.3L502.3,136.1L500.3,142.4L494,148.1L485.1,150.1L475.3,147.6L473.9,130.5L477.8,128.5L494.7,129.4L496.7,122.2L487.2,114.8L495.5,114.9L510.6,106.6L513.1,102.5L524.4,99.9L523.7,91.4L529.4,89.6L526.8,95.9L530.4,100L539.2,100.7L559.1,96.7L564.8,85.6L577.7,84.8L578,81.9L563.5,83.8L558.5,76.1L570.5,69.1L561.6,67.4L559.4,71.1L549.6,75.7L547.6,79.6L552.2,83.1L546.7,86.9L544.1,94.2L536,96.2L528.8,84.8L523.3,88L515.7,87.3L513.9,77.9L529.2,70.9L541,61.6L553.3,56.1L568.2,52.7L578.2,52.3L583.3,55L601.4,58.2L611.9,61.3L614.2,64.5L606.6,66.7L594.2,64.6L597.1,71.1L623.7,64.6L620.7,59.5L628.5,60.4L628.7,64.8L649.2,58.7L648.6,60.6L663.3,58.7L668.2,56L690.3,60.9L685.3,52.7L694.3,47.1L701.6,47.8L699.6,51.6L704.6,60L698,65.8L708.5,61.8L703.1,51.5L721.3,49.1L723.6,45.4L741.2,44.6L742.1,41.3L759,38.8L779.9,37.7L783.3,35.3L808.5,36.9L816.3,40.8L803.9,43.9L815.4,46.3L821,45.1L842.2,47.3L842.4,45.2L857.2,47.1L856.8,50.1L864.7,53.4L867.4,50.5L888.5,51.4L890.2,47.6L915.3,49.4L924.9,53.2L941.7,53.1L947.1,57.1L966.2,56.7L971.1,59.2L973.5,55.3L996.1,57.2L1000,58.4L1000,69.5ZM0,58.4L0,58.4L0,58.4L28.1,66.7L17,71.4L0.3,67L0,69.5L0,69.5L0,58.4ZM234.3,58L222.8,57.2L227.2,55.2ZM1000,52.3L1000,53.2L996.5,52.5L1000,51.3L1000,52.3ZM0,51.3L0,51.3L0,51.3L0,52.3L0,51.3ZM0,51.3L0,51.3L0,51.3ZM248.5,57L257.4,63.3L262.4,55.9L274.2,57.9L273.9,63.6L261.8,65.1L257.4,70.1L250.2,72.1L238.2,80.8L237,86.3L243.6,91.4L252.7,92.1L263.9,96.4L271.5,96.8L273.9,105.1L278,107.8L281.7,104L278.3,98.1L287.4,93L281.9,86.7L285.2,83.7L283,76.9L294.9,76.5L306.7,80.4L307.5,86.2L312.1,88.3L320.6,82.4L329.5,91.8L328.3,93.5L340.7,98.3L345.3,105.1L333.2,110.4L315.6,110.5L302.5,119.9L315.1,113.5L320.9,121.6L333.9,122.4L318.4,129L314,125.5L305.2,128.7L305.7,134.3L297.6,135.5L289.7,144.6L289.6,151.2L281.8,155.9L273.6,164.6L277.6,175.3L274.5,180L267.5,166.8L251.1,166.2L251.6,169L237,168.1L229.5,173.9L228.1,187.7L233.6,197.7L237.7,199.6L247.9,196.4L249.2,191.7L258.2,190.2L253,205.9L265.6,206L269,208.3L267.1,218.4L273.8,225.6L279,223.3L286.6,226L290.3,220.5L300.7,215.5L301.7,219.5L310.6,220.7L328.1,220.2L326.7,222.4L341.3,233.4L353.1,235L357.5,238.3L364.9,250.7L379.4,256.6L388.9,258L402.1,265.2L402.4,275L391.8,288.3L389.6,304.4L383.4,313.8L370.9,316.9L365.3,321.9L364.2,329.7L347.4,347.1L337.5,345.6L342.3,352.5L335.5,357.6L326.8,357.9L327.4,363L319.1,364.1L323.7,368.2L312.3,378.6L317.7,381.2L308,390.9L310.7,395.4L302.8,399.5L291.8,395.2L290,385.2L294.1,380.4L289.9,379.6L293.5,372.5L296.8,353.1L301.6,340.1L305.3,309.4L304.5,301L288.9,290.7L278.4,270L273.9,263.2L278.4,257.4L275.1,256.2L277.5,247.9L285.8,239.3L284.8,231.4L280.2,225L277.8,229L269.5,227.2L261.7,221.8L256.5,214.1L246.6,211.3L237,205L231.8,206.5L212.5,199.2L206.3,193.2L205.5,186.7L188.3,169.6L185.7,163.4L181.5,166.2L196.1,185.1L188.4,181.3L182,174.6L174.2,158.2L165.6,154.3L156.3,141.8L154.1,131.2L155.8,123.5L154,115.6L158.4,113.9L146,108.8L137.4,97.8L127.6,88.5L120.5,88.3L111.5,84.6L91.4,80.9L88.8,83.4L74.2,86.5L59.9,94.5L41.8,98.4L61.9,90.1L45,83.9L38.6,79.2L42.9,74.6L53.4,72.9L53.4,70L41.8,71L33,67.6L43.1,65.1L50.9,66.3L40.6,61L50.3,54.6L65.1,51.8L77,53.9L101.1,55.1L120.8,58.6L144.1,54.2L150.7,57L159.2,56L183.6,60L184.7,62L205.1,58.9L210.2,61.1L237,60.9L232,55.3L235.5,50.2ZM182.9,46.9L191.5,48.7L198.9,47L207.2,48.1L209.8,52.8L219.5,55.5L215.5,59L205.7,57.8L185.2,59.6L174.1,55.7L187.7,54.5L172.5,54.1L168.3,51.2L172.6,48ZM209.7,46.1L209.7,46.1L209.7,46.1ZM287.9,46.9L279.2,47.9L276.8,45.1ZM259.6,46.8L271.3,45.1L275.7,49.8L283.8,47.9L308.9,54.1L314,57.8L308.9,59.1L328.2,64.3L322.5,69.4L314.7,65.6L310.7,67.5L318.6,71.2L319.4,75.9L308.9,72.9L316.2,78L308.7,76.9L292.2,71.1L284.1,71.6L283.6,68.6L294.6,68.2L296.4,60.9L280.7,55.1L274.2,56.3L253.7,54.4L249.4,49.3L254.4,45.7ZM221.2,44.9L229.5,45.1L231.8,48.4L226.8,52L215.3,48.6ZM898.9,46.6L898.9,46.6L898.9,46.6ZM241.1,47.9L235,49.8L237.5,44.1L248.6,44.8ZM165.4,51.7L158.1,53.1L150.2,50.4L153,43.6L173.5,43.9L179.1,45.9ZM918.7,41.4L918.7,41.4L918.7,41.4ZM240,41.7L240,41.7L240,41.7ZM903,40.1L900.8,42.2L886,42.7L882,39ZM226.4,36.9L227.3,41.7L219.8,41.5L215.1,38ZM199.4,38.3L204.7,41.7L188.3,43.3L189.5,41.2L173,41L179.4,37.6L197,40.4ZM659.8,53.6L643.3,51.5L654.5,41.4L669.9,38.2L689.3,36.3L689.4,38.2L671.1,40.9L662.4,43.6L653.9,49ZM237,35.8L252.3,40L274.6,39.7L272.4,43.2L243.3,42.1ZM177.2,34.3L166.9,38.7L158.7,38.6L169.2,34.7ZM239.3,34.7L239.3,34.7L239.3,34.7ZM193.9,34.2L193.9,34.2L193.9,34.2ZM568.7,33.7L568.7,33.7L568.7,33.7ZM195.4,31.7L195.4,31.7L195.4,31.7ZM233.8,33.2L233.8,33.2L233.8,33.2ZM222.1,32.4L222.1,32.4L222.1,32.4ZM791.9,32.5L776.2,33.6L781.3,29.9ZM550.7,28.6L559.8,30.7L552.9,31.8L547.6,36.6L531.2,30.9L529,28.7ZM570.7,26.6L572,29.1L555.8,29L548.2,26.9ZM642,26.3L642,26.3L642,26.3ZM777.6,30.9L759.2,29.4L753.3,26.8L766.5,24.3L778.3,28.4ZM258.3,28.7L252.7,32.5L242,32.4L241.3,29.5L231.4,27.3L243.3,24.3ZM309.7,19.1L328.1,21.2L302.3,28.3L286.4,29.7L290.6,31.9L276.2,38.4L251.4,37.6L255.7,32.3L263.6,29.6L245.6,22.5L262.5,20.4L268.9,21.3L279.7,19.1ZM424.7,18L442.1,20.2L437,21.3L411.4,21.7L431,22.8L435.6,24.6L456.2,22.5L466.1,24.2L450.7,27.4L445.3,31.2L448.7,36.2L446.2,43.6L432.6,48.3L439.6,53.7L429,51.6L426.8,54.9L437.9,55.2L422.9,59.8L411.7,60.8L405,64.8L389.4,68.2L381.1,75.9L379.5,83.1L365.9,80.9L356.6,73.3L350.1,63.4L358.7,55.8L351.5,57.5L344.9,51L348,48.4L337.3,40.2L329.8,38.6L309.7,38.7L296.8,32.1L317.5,29.5L311,27.5L341.1,21.7L352.7,22.5L360,21L376.3,23.2L370.1,20.5L379.4,18.8L402.5,17.7Z";
const WORLD_MAP_VIEWBOX = "0 0 1000 500";
const WORLD_HOTSPOTS = [
  { city: "Tokyo", x: 888.03, y: 150.89 },
  { city: "Seoul", x: 852.72, y: 145.64 },
  { city: "Shanghai", x: 837.42, y: 163.25 },
  { city: "Manila", x: 836.06, y: 209.44 },
  { city: "Jakarta", x: 796.81, y: 267.22 },
  { city: "Mumbai", x: 702.44, y: 197 },
  { city: "Sao Paulo", x: 370.47, y: 315.42 },
  { city: "Mexico City", x: 224.64, y: 196.03 },
  { city: "Los Angeles", x: 171.56, y: 155.42 },
  { city: "New York", x: 294.42, y: 136.92 },
  { city: "London", x: 499.64, y: 106.92 },
  { city: "Paris", x: 506.53, y: 114.31 },
  { city: "Lagos", x: 509.39, y: 231.89 },
  { city: "Sydney", x: 920.03, y: 344.08 }
];

// ── WEBGL SHADER BACKGROUND ────────────────────────────────────────────
function ShaderBG() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const vs = `attribute vec4 position; void main(){gl_Position=position;}`;
    const fs = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      void main(){
        vec2 uv=gl_FragCoord.xy/u_resolution.xy;
        float noise=sin(uv.x*10.0+u_time*0.5)*cos(uv.y*10.0-u_time*0.3);
        vec3 color=vec3(0.0,0.05,0.08);
        color+=vec3(0.0,0.1,0.15)*abs(noise)*0.3;
        vec2 grid=fract(uv*20.0);
        float line=smoothstep(0.01,0.0,grid.x)+smoothstep(0.01,0.0,grid.y);
        color+=vec3(0.0,0.5,0.6)*line*0.05;
        gl_FragColor=vec4(color,1.0);
      }`;

    const mkShader = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s); return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(prog, "position");
    const timeLoc = gl.getUniformLocation(prog, "u_time");
    const resLoc = gl.getUniformLocation(prog, "u_resolution");

    let raf;
    const render = (t) => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(prog);
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(timeLoc, t * 0.001);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: "fixed", top: 0, left: 0,
      width: "100vw", height: "100vh",
      zIndex: -1, pointerEvents: "none",
    }} />
  );
}

// ── CSS ────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { min-height: 100%; }
  body {
    background: #000000;
    color: #ffffff;
    font-family: 'Space Grotesk', sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }
  ::selection { background: #00f2ff; color: #000; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #0a0a0a; }
  ::-webkit-scrollbar-thumb { background: #1c1c1c; }
  ::-webkit-scrollbar-thumb:hover { background: #00f2ff; }

  input, select, button, textarea { font-family: 'Space Grotesk', sans-serif; }
  select { appearance: none; }
  input:focus, select:focus { outline: none; }

  .mono { font-family: 'JetBrains Mono', monospace; }

  /* Cyber glow effects */
  .cyber-glow-text { text-shadow: 0 0 8px rgba(0,242,255,0.5); }
  .cyber-border { border: 1px solid #00f2ff; box-shadow: 0 0 10px rgba(0,242,255,0.2); }

  /* Nav link underline animation */
  .nav-link { position: relative; overflow: hidden; }
  .nav-link::after {
    content: '';
    position: absolute; bottom: 0; left: 0;
    width: 100%; height: 2px; background: #00f2ff;
    transform: translateX(-101%); transition: transform 0.3s ease;
  }
  .nav-link:hover::after { transform: translateX(0); }

  /* Search box glow on focus */
  .search-glow:focus-within {
    box-shadow: 0 0 20px rgba(0,242,255,0.3);
    border-color: #00f2ff !important;
  }

  /* Anime row hover */
  .anime-row {
    border-bottom: 1px solid #2d2d2d;
    background: rgba(10,10,10,0.7);
    backdrop-filter: blur(4px);
    transition: background 0.3s ease, border-color 0.3s ease;
  }
  .anime-row:hover {
    background: rgba(0,242,255,0.05);
    border-color: #00f2ff;
  }

  /* Feature card hover */
  .feat-card {
    border: 1px solid rgba(0,242,255,0.1);
    transition: border-color 0.3s ease;
  }
  .feat-card:hover { border-color: #00f2ff; }

  /* Toggle switch */
  .sw-track {
    width: 40px; height: 20px; background: #2e2e2e;
    border-radius: 0; position: relative; cursor: pointer; transition: background 0.2s;
    display: inline-block; flex-shrink: 0;
  }
  .sw-track.on { background: #00f2ff; }
  .sw-dot {
    position: absolute; top: 3px; left: 3px;
    width: 14px; height: 14px; background: #919191;
    border-radius: 0; transition: transform 0.2s, background 0.2s;
  }
  .sw-track.on .sw-dot { transform: translateX(20px); background: #000; }

  /* Tabs */
  .tab-active { color: #00f2ff; border-bottom: 2px solid #00f2ff; }
  .tab-inactive { color: #919191; border-bottom: 2px solid transparent; }
  .tab-inactive:hover { color: #00f2ff; }

  /* Plan watch button */
  .plan-btn {
    border: 2px solid #00f2ff; color: #00f2ff;
    background: transparent; padding: 8px 24px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.15em; cursor: pointer; width: 100%;
    transition: background 0.2s, color 0.2s;
  }
  .plan-btn:hover { background: #00f2ff; color: #000; }
  .plan-btn:active { transform: scale(0.97); }
  .plan-btn[data-planned="true"] {
    background: #00f2ff; color: #000; border-color: #00f2ff;
  }
  .plan-btn[data-planned="true"]:hover { background: transparent; color: #00f2ff; }

  /* Genre tag */
  .genre-tag {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 10px; border: 1px solid #2d2d2d;
    background: #242424; font-family: 'JetBrains Mono', monospace;
    font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em;
    color: #e1e1e1; cursor: pointer; transition: border-color 0.2s;
  }
  .genre-tag:hover { border-color: #00f2ff; }
  .genre-tag .x-icon { opacity: 0.5; font-size: 12px; }

  /* Section tile large number */
  .tile-num {
    position: absolute; top: 0; right: 8px;
    font-size: 60px; line-height: 1; color: rgba(0,242,255,0.08);
    font-family: 'JetBrains Mono', monospace; font-weight: 700;
    pointer-events: none; user-select: none;
  }

  /* Mode toggle buttons (home) */
  .mode-btn-active {
    background: #00f2ff; color: #000;
    font-family: 'JetBrains Mono', monospace; font-size: 11px;
    font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
    padding: 12px 32px; border: none; cursor: pointer;
  }
  .mode-btn-inactive {
    background: transparent; color: rgba(0,242,255,0.6);
    font-family: 'JetBrains Mono', monospace; font-size: 11px;
    font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em;
    padding: 12px 32px; border: none; cursor: pointer;
    transition: color 0.2s;
  }
  .mode-btn-inactive:hover { color: #00f2ff; }

  /* Accordion */
  .accordion-content { display: none; }
  .accordion-content.open { display: block; }

  /* Text gradient */
  .text-grad {
    background: linear-gradient(90deg, #00f2ff 0%, #0088ff 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Glow primary button */
  .primary-btn {
    background: #00f2ff; color: #000;
    border: none; padding: 14px 36px;
    font-family: 'JetBrains Mono', monospace; font-size: 12px;
    font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;
    cursor: pointer; transition: filter 0.2s, transform 0.1s;
    box-shadow: 0 0 20px rgba(0,242,255,0.4);
  }
  .primary-btn:hover { filter: brightness(1.1); }
  .primary-btn:active { transform: scale(0.98); }

  /* Page animations */
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .fade-in { animation: fadeIn 0.4s ease both; }

  /* Advance filter range */
  input[type=range] { accent-color: #00f2ff; height: 4px; }

  /* Result row score badge */
  .score-badge {
    font-family: 'JetBrains Mono', monospace; font-size: 12px;
    color: #00f2ff; font-weight: 500;
  }

  /* Atlas world map hotspot pulse */
  @keyframes atlasPulse { 0%, 100% { opacity: 0.12; r: 9; } 50% { opacity: 0.3; r: 13; } }
  .atlas-pulse { animation: atlasPulse 2.4s ease-in-out infinite; transform-origin: center; }
`;

// ── NAV ────────────────────────────────────────────────────────────────
function Nav({ page, onNav, showHome, username }) {
  return (
    <nav style={{
      background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(0,242,255,0.3)",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "16px 80px", position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
    }}>
      <div onClick={() => onNav("home")} style={{
        fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
        fontSize: 22, color: "#00f2ff", letterSpacing: "0.15em",
        cursor: "pointer", fontStyle: "italic",
      }} className="cyber-glow-text">YUME</div>

      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        {showHome && (
          <span className="nav-link" onClick={() => onNav("home")} style={{
            color: "#00f2ff", fontWeight: 500, cursor: "pointer",
            fontSize: 14, display: "inline-block",
          }}>Home</span>
        )}
      </div>
    </nav>
  );
}

// ── HOME PAGE ──────────────────────────────────────────────────────────
function HomePage({ onNav }) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("mal");

  const go = () => { if (!input.trim()) return; onNav("recommend", { prefill: input.trim(), mode }); };

  const placeholder = mode === "title" ? "INPUT TITLE SEQUENCE" : "INPUT USER SEQUENCE";

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 128 }}>
      {/* ── HERO ── */}
      <section style={{
        width: "100%", maxWidth: 800, padding: "0 20px",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: 520,
      }} className="fade-in">
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
          fontSize: "clamp(64px,10vw,96px)", color: "#fff",
          letterSpacing: "-0.04em", marginBottom: 48, fontStyle: "italic",
          lineHeight: 1,
        }} className="cyber-glow-text">YUME</h1>

        {/* Search */}
        <div style={{ width: "100%", maxWidth: 640 }}>
          <div className="search-glow" style={{
            display: "flex", alignItems: "center",
            background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,242,255,0.5)",
            transition: "all 0.3s",
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && go()}
              placeholder={placeholder}
              style={{
                flex: 1, background: "transparent", border: "none",
                color: "#fff", fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 18, padding: "20px 32px",
                letterSpacing: "0.15em", textTransform: "uppercase",
              }}
            />
            <button onClick={go} style={{
              background: "transparent", border: "none",
              color: "#00f2ff", padding: "0 20px", cursor: "pointer",
              fontSize: 28, display: "flex", alignItems: "center",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00f2ff" strokeWidth="1.5" strokeLinecap="square"><rect x="2" y="4" width="20" height="16" rx="0"/><line x1="6" y1="8" x2="6" y2="8" strokeWidth="2"/><line x1="10" y1="8" x2="10" y2="8" strokeWidth="2"/><line x1="14" y1="8" x2="14" y2="8" strokeWidth="2"/><line x1="18" y1="8" x2="18" y2="8" strokeWidth="2"/><line x1="6" y1="12" x2="6" y2="12" strokeWidth="2"/><line x1="10" y1="12" x2="10" y2="12" strokeWidth="2"/><line x1="14" y1="12" x2="14" y2="12" strokeWidth="2"/><line x1="18" y1="12" x2="18" y2="12" strokeWidth="2"/><line x1="8" y1="16" x2="16" y2="16" strokeWidth="2"/></svg>
            </button>
          </div>
        </div>

        {/* Mode toggles */}
        <div style={{
          display: "flex", marginTop: 32,
          background: "rgba(0,0,0,0.6)", border: "1px solid rgba(0,242,255,0.2)",
        }}>
          <button className={mode === "mal" ? "mode-btn-active" : "mode-btn-inactive"} onClick={() => setMode("mal")}>MyAnimeList</button>
          <button className={mode === "anilist" ? "mode-btn-active" : "mode-btn-inactive"} onClick={() => setMode("anilist")}>AniList</button>
          <button className={mode === "title" ? "mode-btn-active" : "mode-btn-inactive"} onClick={() => setMode("title")}>By Title</button>
        </div>

        <div style={{ marginTop: 48, textAlign: "center" }}>
          <p className="mono" style={{ color: "rgba(0,242,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>
            No verified profile found?
          </p>
          <span onClick={() => onNav("quickstart")} className="mono" style={{
            color: "#00f2ff", fontSize: 11, textTransform: "uppercase",
            letterSpacing: "0.1em", borderBottom: "1px solid rgba(0,242,255,0.3)",
            paddingBottom: 4, cursor: "pointer",
          }}>Initialize Recommender Engine</span>
        </div>
      </section>

      {/* ── ABOUT COLUMNS ── */}
      <section style={{
        width: "100%", maxWidth: 1200, padding: "96px 80px",
        borderTop: "1px solid rgba(0,242,255,0.2)",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          {[
            { n: "01", t: "SYSTEM OVERVIEW", body: ["YUME operates as a high-fidelity recommendation node. Utilizing advanced ML TF-IDF vectorization, it processes anime metadata into a high-dimensional vector space to map user preferences with mathematical precision.", "Integration provides deep telemetry into watch history, enabling real-time visualization of your personal anime vector through the Atlas portal.", <span>The entire framework is <span style={{ color: "#00f2ff", fontWeight: 700 }}>OPEN_SOURCE</span>, maintaining total transparency for all grid participants.</span>] },
            { n: "02", t: "VECTOR ENGINE", body: ["Our recommendation core leverages TF-IDF (Term Frequency-Inverse Document Frequency) to weigh the significance of anime tags and genres within your profile.", "By calculating Cosine Similarity between user vectors and the global anime manifold, the engine identifies latent taste clusters with extreme accuracy."] },
            { n: "03", t: "ABOUT YUME", body: ["YUME is an open-source recommendation engine built for high-fidelity discovery. It bridges the gap between raw tracking data and meaningful content exploration.", "The system is designed to be modular, allowing for community-driven improvements to the underlying vectorization and similarity algorithms.", <span>Built using high-density <span style={{ color: "#fff", fontWeight: 700, fontStyle: "italic" }}>Graph Embeddings</span> for maximum relational accuracy.</span>] },
          ].map(c => (
            <div key={c.n} className="feat-card fade-in" style={{
              padding: "40px", background: "rgba(14,14,14,0.5)",
              position: "relative", overflow: "hidden",
            }}>
              <div className="tile-num">{c.n}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
                <span style={{ color: "#00f2ff", fontSize: 20 }}>{c.icon}</span>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.1em" }}>{c.t}</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {c.body.map((p, i) => (
                  <p key={i} style={{ color: "#a0a0a0", lineHeight: 1.7, fontWeight: 300, fontSize: 14 }}>{p}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

// ── RECOMMEND PAGE ─────────────────────────────────────────────────────
function RecommendPage({ onResults, loading, setLoading, prefill }) {
  const [input, setInput] = useState(prefill || "");
  const [mode, setMode] = useState("mal");
  const [error, setError] = useState(null);

  const go = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(null);
    try {
      const url = mode === "title"
        ? `${API}/api/recommend?title=${encodeURIComponent(input.trim())}&n=20`
        : `${API}/api/${mode}?username=${encodeURIComponent(input.trim())}&n=20`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      if (!data.recommendations?.length) throw new Error("No recommendations found.");
      onResults({ recs: data.recommendations, username: mode !== "title" ? input.trim() : null, matched_title: mode === "title" ? data.matched_title : null, titles_fetched: data.titles_fetched, titles_matched: data.titles_matched });
    } catch (err) {
      setError(err.message.includes("fetch") ? "BACKEND_OFFLINE — Could not reach Flask on port 5000." : err.message);
    } finally { setLoading(false); }
  };

  return (
    <main style={{ minHeight: "100vh", paddingTop: 128, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 640, padding: "0 20px" }} className="fade-in">
        <div className="mono" style={{ color: "rgba(0,242,255,0.5)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 16 }}>// INITIALIZE_SESSION</div>
        <h1 style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8, fontStyle: "italic" }} className="cyber-glow-text">YUME</h1>
        <p style={{ color: "#a0a0a0", fontSize: 14, marginBottom: 40, lineHeight: 1.6 }}>
          Input your MAL or AniList username to initialize the recommendation engine.
        </p>

        {/* Mode toggles */}
        <div style={{ display: "flex", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(0,242,255,0.2)", marginBottom: 4, width: "fit-content" }}>
          {[["mal","MyAnimeList"],["anilist","AniList"],["title","By Title"]].map(([v,l]) => (
            <button key={v} className={mode===v ? "mode-btn-active" : "mode-btn-inactive"} onClick={() => setMode(v)}>{l}</button>
          ))}
        </div>

        <div className="search-glow" style={{ display: "flex", alignItems: "center", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,242,255,0.5)", transition: "all 0.3s", marginBottom: 4 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && go()}
            placeholder={mode === "title" ? "TITLE SEQUENCE..." : "USER_SEQUENCE..."}
            style={{ flex: 1, background: "transparent", border: "none", color: "#fff", fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, padding: "18px 28px", letterSpacing: "0.1em", textTransform: "uppercase" }}
          />
          <button onClick={go} disabled={loading} style={{ background: loading ? "rgba(0,242,255,0.5)" : "#00f2ff", color: "#000", border: "none", padding: "0 24px", cursor: loading ? "default" : "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", height: "100%", alignSelf: "stretch" }}>
            {loading ? "SCANNING..." : "EXECUTE"}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: "12px 16px", border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.06)", color: "#F87171", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, lineHeight: 1.6 }}>
            ERROR: {error}
            {error.includes("BACKEND") && (
              <button onClick={() => { setError(null); onResults({ recs: DEMO_RECS, username: input.trim() || "DEMO_USER", titles_fetched: 312, titles_matched: 298, demo: true }); }}
                style={{ display: "block", marginTop: 12, background: "transparent", border: "1px solid rgba(239,68,68,0.4)", color: "#F87171", fontSize: 10, padding: "6px 14px", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                → LOAD_DEMO_DATA
              </button>
            )}
          </div>
        )}

        <div className="mono" style={{ fontSize: 11, color: "rgba(0,242,255,0.4)", marginTop: 20 }}>
          {">"} Demo: <span style={{ color: "#00f2ff", cursor: "pointer" }} onClick={() => { setMode("mal"); setInput("Gintoki_Sakata"); }}>Gintoki_Sakata</span> [MAL]
        </div>
      </div>
    </main>
  );
}

// ── SYNOPSIS CELL (expand/collapse) ────────────────────────────────────
function SynopsisCell({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ flex: 1, padding: "14px 18px", position: "relative", display: "flex", alignItems: "flex-start", gap: 12 }}>
      <p style={{
        color: "#919191", fontSize: 12.5, lineHeight: 1.6, margin: 0,
        display: open ? "block" : "-webkit-box",
        WebkitLineClamp: open ? "unset" : 3,
        WebkitBoxOrient: "vertical",
        overflow: open ? "visible" : "hidden",
      }}>{text}</p>
      <button onClick={() => setOpen(o => !o)} style={{
        background: "transparent", border: "none", color: "#00f2ff",
        cursor: "pointer", flexShrink: 0, padding: 2, marginTop: 1,
        transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
    </div>
  );
}

// ── ATLAS WORLD MAP (glowing popularity dots) ────────────────────────────
function AtlasWorldMap({ recs }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const coastlineRef = useRef(null);
  const [borderDots, setBorderDots] = useState([]);

  // Randomly assigns this session's recommendations across real-world
  // hotspot coordinates for visual effect (no real "popularity by
  // location" data source exists in this app).
  const dots = useMemo(() => {
    if (!recs?.length) return [];
    const shuffledCities = [...WORLD_HOTSPOTS].sort(() => Math.random() - 0.5);
    const shuffledRecs = [...recs].sort(() => Math.random() - 0.5);
    const count = Math.min(shuffledCities.length, shuffledRecs.length);
    return shuffledCities.slice(0, count).map((c, i) => ({ ...c, anime: shuffledRecs[i].Name }));
  }, [recs]);

  // Scatter small gold dots directly along the actual rendered coastline
  // (sampled from the real path geometry via getPointAtLength), matching
  // the reference image's dense golden border speckle.
  useEffect(() => {
    if (!coastlineRef.current) return;
    const total = coastlineRef.current.getTotalLength();
    const spacing = 3;
    const maxDots = 3500;
    const count = Math.min(maxDots, Math.floor(total / spacing));
    const pts = [];
    for (let i = 0; i < count; i++) {
      const p = coastlineRef.current.getPointAtLength((total / count) * i);
      pts.push({
        x: p.x + (Math.random() - 0.5) * 2.2,
        y: p.y + (Math.random() - 0.5) * 2.2,
        r: Math.random() * 0.5 + 0.25,
        o: Math.random() * 0.45 + 0.35,
      });
    }
    setBorderDots(pts);
  }, [dots]);

  // Dense scatter of varied-size "star" dots across the whole viewbox —
  // rendered inside a clipPath so only the portion over land shows,
  // giving the whole country surface (not just the coastline) that
  // organic, twinkly speckled look from the reference image.
  const landStars = useMemo(() => {
    return Array.from({ length: 6000 }, () => {
      const bright = Math.random() < 0.05;
      return {
        x: Math.random() * 1000,
        y: Math.random() * 500,
        r: bright ? Math.random() * 0.6 + 0.5 : Math.random() * 0.45 + 0.15,
        o: bright ? Math.random() * 0.3 + 0.6 : Math.random() * 0.5 + 0.2,
        fill: bright ? "#fff6df" : "#f7c55a",
      };
    });
  }, []);

  // Faint background starfield, generated once per mount (purely decorative)
  const stars = useMemo(() => {
    return Array.from({ length: 220 }, () => ({
      x: Math.random() * 1000,
      y: Math.random() * 500,
      r: Math.random() * 0.8 + 0.15,
      o: Math.random() * 0.5 + 0.15,
      big: Math.random() < 0.08,
    }));
  }, []);

  // Thin dashed rays fanning out from each hotspot out to sea, echoing the
  // reference image's radiating light-trail look (distinct from the mesh
  // lines connecting hotspots to each other below).
  const rays = useMemo(() => {
    const out = [];
    dots.forEach((d, i) => {
      const rayCount = 5;
      for (let k = 0; k < rayCount; k++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * 160;
        out.push({
          key: `${d.city}-ray-${k}`,
          x1: d.x, y1: d.y,
          x2: d.x + Math.cos(angle) * dist,
          y2: d.y + Math.sin(angle) * dist,
        });
      }
    });
    return out;
  }, [dots]);

  if (!dots.length) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh" }}>
        <div className="mono" style={{ color: "rgba(0,242,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em" }}>// NO_DATA</div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", background: "#000", border: "1px solid #2d2d2d" }}>
      <svg viewBox={WORLD_MAP_VIEWBOX} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <pattern id="worldDotFill" width="3.2" height="3.2" patternUnits="userSpaceOnUse">
            <circle cx="0.9" cy="0.9" r="0.5" fill="rgba(140,158,182,0.55)" />
          </pattern>
          <clipPath id="worldClip">
            <path d={WORLD_MAP_PATH} />
          </clipPath>
          <filter id="atlasBlurSoft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <filter id="atlasBlurWide" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        {/* background stars, mostly small with a handful of brighter ones */}
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.big ? s.r * 2.2 : s.r} fill={s.big ? "#fff6df" : "#f7c55a"} opacity={s.big ? Math.min(1, s.o + 0.3) : s.o} />
        ))}

        {/* soft gold halo bleeding out from the coastline */}
        <path d={WORLD_MAP_PATH} fill="none" stroke="#f7c55a" strokeWidth="5" opacity="0.3" filter="url(#atlasBlurWide)" />

        {/* grey-blue stippled continent base */}
        <path d={WORLD_MAP_PATH} fill="url(#worldDotFill)" stroke="none" />

        {/* dense varied-size star scatter covering the whole land surface */}
        <g clipPath="url(#worldClip)">
          {landStars.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.fill} opacity={s.o} />
          ))}
        </g>

        {/* crisp bright coastline on top */}
        <path ref={coastlineRef} d={WORLD_MAP_PATH} fill="none" stroke="rgba(255,250,235,0.9)" strokeWidth="0.7" />

        {/* dense golden dots scattered directly along the coastline */}
        {borderDots.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r={b.r} fill="#f7c55a" opacity={b.o} />
        ))}

        {/* dashed rays fanning out from each hotspot */}
        {rays.map(r => (
          <line key={r.key} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke="rgba(247,197,90,0.22)" strokeWidth="0.35" strokeDasharray="1,2.4" />
        ))}

        {/* faint mesh lines connecting hotspots to each other */}
        {dots.map((d, i) =>
          dots.slice(i + 1).map((d2, j) => (
            <line
              key={`${d.city}-${d2.city}-${j}`}
              x1={d.x} y1={d.y} x2={d2.x} y2={d2.y}
              stroke="rgba(247,197,90,0.1)" strokeWidth="0.3" strokeDasharray="1,2.4"
            />
          ))
        )}

        {/* lens-flare style hotspot markers */}
        {dots.map((d, i) => (
          <g key={d.city} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)} style={{ cursor: "pointer" }}>
            <circle cx={d.x} cy={d.y} r={16} fill="#f7c55a" opacity={0.25} filter="url(#atlasBlurSoft)" className={hoverIdx === i ? "" : "atlas-pulse"} />
            <line x1={d.x - 10} y1={d.y} x2={d.x + 10} y2={d.y} stroke="#fff6df" strokeWidth="0.4" opacity="0.7" />
            <line x1={d.x} y1={d.y - 10} x2={d.x} y2={d.y + 10} stroke="#fff6df" strokeWidth="0.4" opacity="0.7" />
            <circle cx={d.x} cy={d.y} r={2.6} fill="#fff6df" style={{ filter: "drop-shadow(0 0 6px #f7c55a) drop-shadow(0 0 14px rgba(247,197,90,0.8))" }} />
          </g>
        ))}
      </svg>

      {hoverIdx !== null && (() => {
        const d = dots[hoverIdx];
        const pctX = (d.x / 1000) * 100;
        // Keep the tooltip from clipping off the edges for extreme-longitude
        // hotspots (e.g. Tokyo/Sydney near the right edge)
        const translateX = pctX < 10 ? "0%" : pctX > 90 ? "-100%" : "-50%";
        return (
          <div className="mono" style={{
            position: "absolute",
            left: `${pctX}%`, top: `${(d.y / 500) * 100}%`,
            transform: `translate(${translateX}, -140%)`,
            background: "#000", border: "1px solid #f7c55a", color: "#f7c55a",
            padding: "6px 12px", fontSize: 11, textTransform: "uppercase",
            letterSpacing: "0.08em", whiteSpace: "nowrap", pointerEvents: "none",
            boxShadow: "0 0 12px rgba(247,197,90,0.45)", zIndex: 5,
          }}>
            {d.anime}
          </div>
        );
      })()}
    </div>
  );
}

// ── RESULTS PAGE ───────────────────────────────────────────────────────
function ResultsPage({ meta, recs, onBack }) {
  const [activeTab, setActiveTab] = useState("recs");
  const [genres, setGenres] = useState({});
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [filters, setFilters] = useState({ seasons: false, movies: false, ovas: false });
  const [planned, setPlanned] = useState({});

  const togglePlanned = (name) => setPlanned(p => ({ ...p, [name]: !p[name] }));

  const username = meta.username || meta.matched_title || "USER";

  const filtered = recs.filter(a => Number(a.Score) >= minRating);

  const removeGenre = (anime, genre) => {
    const key = anime.Name;
    setGenres(prev => ({ ...prev, [key]: [...(prev[key] || anime.Genres.split(",").map(g => g.trim())).filter(g => g !== genre)] }));
  };

  const getGenres = (anime) => genres[anime.Name] || anime.Genres.split(",").map(g => g.trim()).filter(Boolean);

  return (
    <main style={{ width: "100%", maxWidth: 1200, margin: "0 auto", padding: "112px 80px 60px", display: "flex", flexDirection: "column" }} className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28, borderLeft: "4px solid #00f2ff", paddingLeft: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", display: "flex", alignItems: "center", gap: 14 }}>
          <span className="mono" style={{ color: "rgba(0,242,255,0.5)", fontSize: 12, fontWeight: 400 }}>USER_SESSION:</span>
          Recommendations for {username}
        </h1>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #2d2d2d", marginBottom: 24, background: "rgba(10,10,10,0.5)", backdropFilter: "blur(4px)" }}>
        {[["recs","Anime Recommendations"],["stats","Profile Stats + Analytics"],["atlas","Atlas Visualization"]].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} className={`mono ${activeTab===id?"tab-active":"tab-inactive"}`} style={{ padding: "13px 26px", background: "transparent", border: "none", cursor: "pointer", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", transition: "color 0.2s" }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === "recs" && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Filter toggles */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, background: "rgba(10,10,10,0.8)", border: "1px solid #2d2d2d", padding: "18px 20px", marginBottom: 1, backdropFilter: "blur(4px)" }}>
            {[["seasons","Extra Seasons"],["movies","Movies"],["ovas","ONAs / OVAs / Specials"]].map(([k,l]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span className="mono" style={{ fontSize: 11, color: "#919191", textTransform: "uppercase", letterSpacing: "0.05em" }}>{l}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className={`sw-track${filters[k] ? " on" : ""}`} onClick={() => setFilters(f => ({...f,[k]:!f[k]}))}>
                    <div className="sw-dot" />
                  </div>
                  <span className="mono" style={{ fontSize: 11, color: "#919191", minWidth: 24 }}>{filters[k] ? "ON" : "OFF"}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Accordion */}
          <div style={{ background: "rgba(10,10,10,0.8)", border: "1px solid #2d2d2d", borderTop: "none", marginBottom: 18, backdropFilter: "blur(4px)" }}>
            <button onClick={() => setAccordionOpen(o => !o)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", background: "transparent", border: "none", cursor: "pointer", color: "#e1e1e1", transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.03)"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}>
              <span style={{ fontSize: 13, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.12em" }}>Advanced System Filters</span>
              <span style={{ color: "#919191", fontSize: 18 }}>{accordionOpen ? "−" : "+"}</span>
            </button>
            {accordionOpen && (
              <div style={{ padding: "32px 24px", borderTop: "1px solid #2d2d2d", background: "rgba(5,5,5,0.5)", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 32 }}>
                <div>
                  <label className="mono" style={{ fontSize: 10, textTransform: "uppercase", color: "rgba(0,242,255,0.7)", letterSpacing: "0.15em", display: "block", marginBottom: 12 }}>Min. Rating Score</label>
                  <input type="range" min="0" max="10" step="0.5" value={minRating} onChange={e => setMinRating(Number(e.target.value))} style={{ width: "100%" }} />
                  <span className="mono" style={{ fontSize: 11, color: "#00f2ff", marginTop: 4, display: "block" }}>{minRating.toFixed(1)}+</span>
                </div>
                <div>
                  <label className="mono" style={{ fontSize: 10, textTransform: "uppercase", color: "rgba(0,242,255,0.7)", letterSpacing: "0.15em", display: "block", marginBottom: 12 }}>Temporal Range</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input placeholder="1990" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid #2d2d2d", color: "#e1e1e1", padding: "10px 12px", width: "100%", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor="#00f2ff"} onBlur={e => e.target.style.borderColor="#2d2d2d"} />
                    <input placeholder="2024" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid #2d2d2d", color: "#e1e1e1", padding: "10px 12px", width: "100%", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor="#00f2ff"} onBlur={e => e.target.style.borderColor="#2d2d2d"} />
                  </div>
                </div>
                <div>
                  <label className="mono" style={{ fontSize: 10, textTransform: "uppercase", color: "rgba(0,242,255,0.7)", letterSpacing: "0.15em", display: "block", marginBottom: 12 }}>Exclusion Protocols</label>
                  <input placeholder="TAG_ID, TAG_ID..." style={{ background: "rgba(0,0,0,0.5)", border: "1px solid #2d2d2d", color: "#e1e1e1", padding: "10px 12px", width: "100%", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor="#00f2ff"} onBlur={e => e.target.style.borderColor="#2d2d2d"} />
                </div>
              </div>
            )}
          </div>

          {/* Results list */}
          <div style={{ border: "1px solid #2d2d2d" }}>
            {filtered.map((anime, i) => {
              const gs = getGenres(anime);
              const pct = Math.round((anime.similarity_score || 0) * 100);
              return (
                <div key={anime.Name + i} className="anime-row" style={{ display: "flex", minHeight: 120 }}>
                  {/* Image */}
                  <div style={{ width: 90, flexShrink: 0, overflow: "hidden" }}>
                    <img src={anime.Image_URL} alt={anime.Name} onError={e => e.target.style.display="none"} style={{ width: "100%", height: "100%", objectFit: "cover", borderRight: "1px solid #2d2d2d", display: "block" }} />
                  </div>

                  {/* Name + button */}
                  <div style={{ width: "20%", padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between", borderRight: "1px solid #2d2d2d", background: "rgba(0,242,255,0.02)" }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.25 }}>{anime.Name}</h3>
                    <div>
                      <div className="mono" style={{ fontSize: 10, color: "rgba(0,242,255,0.6)", marginBottom: 6 }}>
                        SCORE: <span style={{ color: "#00f2ff" }}>{Number(anime.Score || 0).toFixed(2)}</span>
                        &nbsp;·&nbsp;MATCH: <span style={{ color: "#00f2ff" }}>{pct}%</span>
                      </div>
                      <button className="plan-btn" style={{ padding: "6px 14px", fontSize: 9 }}
                        onClick={() => togglePlanned(anime.Name)}
                        data-planned={!!planned[anime.Name]}
                      >{planned[anime.Name] ? "✓ PLANNED" : "+ PLAN WATCH"}</button>
                    </div>
                  </div>

                  {/* Genres */}
                  <div style={{ width: "20%", padding: "14px 16px", display: "flex", flexWrap: "wrap", gap: 5, alignContent: "flex-start", borderRight: "1px solid #2d2d2d" }}>
                    {gs.map(g => (
                      <span key={g} className="genre-tag" onClick={() => removeGenre(anime, g)}>
                        {g} <span className="x-icon">✕</span>
                      </span>
                    ))}
                  </div>

                  {/* Synopsis */}
                  <SynopsisCell text={anime.Synopsis} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "stats" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 24 }}>
          <div className="mono" style={{ color: "rgba(0,242,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em" }}>// MODULE_NOT_LOADED</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "#2d2d2d" }}>
            {[[meta.titles_fetched||recs.length,"WATCHED"],[recs.length,"MATCHES"],[(recs.reduce((s,a)=>s+Number(a.Score||0),0)/recs.length).toFixed(2),"AVG_SCORE"],[`${meta.titles_matched?Math.round((meta.titles_matched/meta.titles_fetched)*100):95}%`,"CONFIDENCE"]].map(([v,l]) => (
              <div key={l} style={{ padding: "28px 32px", background: "#000", textAlign: "center" }}>
                <div className="mono" style={{ fontSize: 36, fontWeight: 700, color: "#00f2ff", letterSpacing: "-0.02em" }}>{v}</div>
                <div className="mono" style={{ fontSize: 10, color: "#919191", marginTop: 6, letterSpacing: "0.1em" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: activeTab === "atlas" ? "block" : "none" }}>
        <AtlasWorldMap recs={recs} />
      </div>
    </main>
  );
}

// ── FOOTER ─────────────────────────────────────────────────────────────
function Footer({ onNav }) {
  return (
    <footer style={{ background: "#000", borderTop: "1px solid rgba(0,242,255,0.2)", padding: "64px 80px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 48 }}>
        <div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: "#00f2ff", letterSpacing: "0.15em", fontStyle: "italic", marginBottom: 8 }} className="cyber-glow-text">YUME</div>
          <p className="mono" style={{ fontSize: 10, color: "rgba(0,242,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>© 2024 SYSTEM_YUME // DISCOVERY_NODE</p>
        </div>
        <div style={{ display: "flex", gap: 40 }}>
          {["Privacy","Support","GitHub"].map(l => (
            <a key={l} href="#" onClick={e => { e.preventDefault(); if (l === "Privacy") onNav("privacy"); }} className="mono" style={{ fontSize: 11, color: "#919191", textTransform: "uppercase", letterSpacing: "0.15em", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color="#00f2ff"} onMouseLeave={e => e.target.style.color="#919191"}>{l}</a>
          ))}
        </div>
        <div className="mono" style={{ fontSize: 11, color: "rgba(0,242,255,0.6)", textTransform: "uppercase" }}>
          Created by <a href="#" style={{ color: "#00f2ff", fontWeight: 700, textDecoration: "none" }}>SAMIKSHA TRIPATHY</a>
        </div>
      </div>
    </footer>
  );
}

// ── PRIVACY POLICY PAGE (landscape) ─────────────────────────────────────
function PrivacyPage() {
  const sections = [
    { n: "1", t: "Introduction", body: "Welcome to the Anime Recommendation System, operating under the YUME Engine protocol. Your digital autonomy and privacy are at the core of our technical architecture. This document outlines how we interact with data while ensuring your footprint remains minimal." },
    { n: "2", t: "Information We Collect", box: "The Anime Recommendation System does not collect, store, or retain any personal information. We operate on a 'Zero Persistence' model, meaning your identity remains decoupled from our processing cycles." },
    { n: "3", t: "How Information Is Used", list: [
      "Retrieve your publicly available anime list via external APIs.",
      "Generate personalized anime recommendations using our proprietary matching algorithms.",
      "Display recommendation results in your current session interface.",
    ] },
    { n: "4", t: "Data Storage", cards: [
      ["USERNAMES","Volatile only. Never cached."],
      ["ANIME LISTS","Processed in RAM, then purged."],
      ["HISTORY","Non-existent storage logs."],
    ], note: "The Anime Recommendation System does not store usernames, anime lists, or recommendation history on any persistent physical media." },
    { n: "5", t: "Third-Party Services", body: "This application uses the official APIs provided by MyAnimeList and AniList. When you input a username, we proxy these requests to fetch public data. Your use of these features is also governed by their respective privacy policies." },
    { n: "6", t: "Cookies", box: "This application does not use cookies, trackers, or any persistent browser-side storage tokens for user profiling." },
    { n: "7", t: "Data Security", body: "As no personal information is collected or stored, the risk of data breaches involving your identity within our system is effectively neutralized. All transmission of data between your client and our API endpoints is secured via high-grade TLS encryption." },
    { n: "8", t: "Changes to Policy", body: "This Privacy Policy may be updated from time to time to reflect technical upgrades or regulatory changes. We encourage users to review this page periodically to remain informed on our data processing protocols." },
  ];

  return (
    <main style={{ minHeight: "100vh", paddingTop: 100, paddingBottom: 80 }} className="fade-in">
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 60px" }}>
        <h1 style={{ fontSize: 42, fontWeight: 700, color: "#00f2ff", letterSpacing: "0.05em", textTransform: "uppercase" }} className="cyber-glow-text">Privacy Policy</h1>
        <p className="mono" style={{ fontSize: 11, color: "rgba(0,242,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 10, marginBottom: 40 }}>Last Updated: June 30, 2026</p>
        <div style={{ height: 1, background: "rgba(0,242,255,0.15)", marginBottom: 48 }} />

        {/* landscape grid: 2 columns wide */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 48px" }}>
          {sections.map(s => (
            <div key={s.n} style={{ marginBottom: 8 }}>
              <h2 className="mono" style={{ fontSize: 13, color: "#00f2ff", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#00f2ff" }}>▪</span>{s.n}. {s.t}
              </h2>

              {s.body && <p style={{ color: "#a0a0a0", fontSize: 13, lineHeight: 1.75, fontWeight: 300 }}>{s.body}</p>}

              {s.box && (
                <div style={{ background: "rgba(20,20,20,0.7)", border: "1px solid #2d2d2d", padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                  {s.icon && <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>}
                  <p className="mono" style={{ color: "#919191", fontSize: 12, lineHeight: 1.7 }}>{s.box}</p>
                </div>
              )}

              {s.list && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {s.list.map((item, i) => (
                    <div key={i} className="mono" style={{ display: "flex", gap: 10, fontSize: 12, color: "#a0a0a0", lineHeight: 1.6 }}>
                      <span style={{ color: "#00f2ff", flexShrink: 0 }}>▸</span>{item}
                    </div>
                  ))}
                </div>
              )}

              {s.cards && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
                    {s.cards.map(([t, d]) => (
                      <div key={t} style={{ background: "rgba(20,20,20,0.7)", border: "1px solid #2d2d2d", padding: "12px 10px" }}>
                        <div className="mono" style={{ fontSize: 10, color: "#00f2ff", letterSpacing: "0.08em", marginBottom: 6 }}>{t}</div>
                        <div className="mono" style={{ fontSize: 10, color: "#666", lineHeight: 1.5 }}>{d}</div>
                      </div>
                    ))}
                  </div>
                  <p style={{ color: "#a0a0a0", fontSize: 12, lineHeight: 1.7, fontWeight: 300 }}>{s.note}</p>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Contact section - full width */}
        <div style={{ marginTop: 16, gridColumn: "1 / -1" }}>
          <h2 className="mono" style={{ fontSize: 13, color: "#00f2ff", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#00f2ff" }}>▪</span>9. Contact
          </h2>
          <p style={{ color: "#a0a0a0", fontSize: 13, lineHeight: 1.75, fontWeight: 300, marginBottom: 16 }}>
            If you have any questions regarding this Privacy Policy or the YUME Engine technical architecture, contact the developer:
          </p>
          <button className="mono" style={{ background: "transparent", border: "1px solid #00f2ff", color: "#00f2ff", padding: "10px 20px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", transition: "background 0.2s, color 0.2s" }}
            onMouseEnter={e => { e.target.style.background = "#00f2ff"; e.target.style.color = "#000"; }}
            onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = "#00f2ff"; }}>
            @ tripathy.samiksha@gmail.com
          </button>
        </div>
      </div>
    </main>
  );
}

// ── QUICKSTART RECOMMENDER MODAL (4-title popup, images only) ───────────
function QuickRecommendModal({ show, onClose }) {
  const [titles, setTitles] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recs, setRecs] = useState(null);

  // Reset form shortly after closing so it's fresh next time it opens
  useEffect(() => {
    if (!show) {
      const t = setTimeout(() => { setTitles(["", "", "", ""]); setError(null); setRecs(null); }, 300);
      return () => clearTimeout(t);
    }
  }, [show]);

  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") onClose(); };
    if (show) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, onClose]);

  if (!show) return null;

  const setTitle = (i, v) => setTitles(prev => prev.map((t, idx) => idx === i ? v : t));
  const filled = titles.filter(t => t.trim()).length;

  const go = async () => {
    if (filled < 4 || loading) return;
    setLoading(true); setError(null);
    try {
      const q = titles.map(t => t.trim()).join(",");
      const res = await fetch(`${API}/api/recommend-multi?titles=${encodeURIComponent(q)}&n=12`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      if (!data.recommendations?.length) throw new Error("No recommendations found.");
      setRecs(data.recommendations);
    } catch (err) {
      setError(err.message.includes("fetch") ? "BACKEND_OFFLINE — Could not reach Flask on port 5000." : err.message);
    } finally { setLoading(false); }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="fade-in"
        style={{
          width: "100%", maxWidth: recs ? 760 : 520, maxHeight: "85vh", overflowY: "auto",
          background: "#050505", border: "1px solid rgba(0,242,255,0.4)",
          boxShadow: "0 0 40px rgba(0,242,255,0.15)", padding: "36px 40px", position: "relative",
        }}
      >
        <button
          onClick={onClose} aria-label="Close"
          style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", color: "#919191", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: 4 }}
          onMouseEnter={e => e.target.style.color = "#00f2ff"} onMouseLeave={e => e.target.style.color = "#919191"}
        >×</button>

        {!recs ? (
          <>
            <div className="mono" style={{ color: "rgba(0,242,255,0.5)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 12 }}>// QUICKSTART_SESSION</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8, fontStyle: "italic" }} className="cyber-glow-text">Initialize Recommender Engine</h2>
            <p style={{ color: "#a0a0a0", fontSize: 13, marginBottom: 28, lineHeight: 1.6 }}>
              Enter 4 anime you like. YUME will map their vectors and surface matches.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
              {titles.map((t, i) => (
                <div key={i}>
                  <div className="mono" style={{ fontSize: 10, color: "rgba(0,242,255,0.4)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 6 }}>
                    // ANIME_{String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="search-glow" style={{ display: "flex", alignItems: "center", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,242,255,0.5)", transition: "all 0.3s" }}>
                    <input
                      value={t}
                      onChange={e => setTitle(i, e.target.value)}
                      onKeyDown={e => e.key === "Enter" && go()}
                      placeholder="TITLE SEQUENCE..."
                      style={{ flex: 1, background: "transparent", border: "none", color: "#fff", fontFamily: "'Space Grotesk',sans-serif", fontSize: 14, padding: "14px 18px", letterSpacing: "0.05em" }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div style={{ marginBottom: 20, padding: "12px 16px", border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.06)", color: "#F87171", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, lineHeight: 1.6 }}>
                ERROR: {error}
              </div>
            )}

            <button
              className="primary-btn"
              disabled={filled < 4 || loading}
              onClick={go}
              style={{ width: "100%", opacity: (filled < 4 || loading) ? 0.5 : 1, cursor: (filled < 4 || loading) ? "default" : "pointer" }}
            >
              {loading ? "SCANNING..." : filled < 4 ? `ENTER ${4 - filled} MORE` : "EXECUTE"}
            </button>
          </>
        ) : (
          <>
            <div className="mono" style={{ color: "rgba(0,242,255,0.5)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 12 }}>// MATCHES_FOUND</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 24, fontStyle: "italic" }} className="cyber-glow-text">Recommendations</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              {recs.map((r, i) => (
                <img
                  key={i} src={r.Image_URL} title={r.Name} alt={r.Name}
                  style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", border: "1px solid #2d2d2d", transition: "border-color 0.2s, transform 0.2s" }}
                  onMouseEnter={e => { e.target.style.borderColor = "#00f2ff"; e.target.style.transform = "scale(1.03)"; }}
                  onMouseLeave={e => { e.target.style.borderColor = "#2d2d2d"; e.target.style.transform = "scale(1)"; }}
                />
              ))}
            </div>
            <button
              className="mode-btn-inactive"
              style={{ marginTop: 24, border: "1px solid rgba(0,242,255,0.2)", width: "100%" }}
              onClick={() => setRecs(null)}
            >
              ← TRY DIFFERENT TITLES
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── ROOT ───────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [prefill, setPrefill] = useState(null);
  const [showQuickModal, setShowQuickModal] = useState(false);

  const onResults = d => { setResults({ recs: d.recs, meta: d }); setPage("results"); };
  const onNav = (id, opts) => {
    if (id === "quickstart") { setShowQuickModal(true); return; }
    if (opts?.prefill) setPrefill(opts.prefill);
    if (id === "results" && !results) return;
    setPage(id);
  };

  const showHome = page !== "home";

  return (
    <>
      <style>{CSS}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
      <ShaderBG />
      <Nav page={page} onNav={onNav} showHome={showHome} username={results?.meta?.username} />
      <QuickRecommendModal show={showQuickModal} onClose={() => setShowQuickModal(false)} />
      {page === "home"      && <><HomePage onNav={onNav} /><Footer onNav={onNav} /></>}
      {page === "recommend" && <RecommendPage onResults={onResults} loading={loading} setLoading={setLoading} prefill={prefill} />}
      {page === "results"   && results && <><ResultsPage meta={results.meta} recs={results.recs} onBack={() => setPage("recommend")} /><Footer onNav={onNav} /></>}
      {page === "privacy"   && <><PrivacyPage /><Footer onNav={onNav} /></>}
    </>
  );
}