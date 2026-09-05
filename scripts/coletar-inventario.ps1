<#
.SYNOPSIS
    Coleta o inventário de hardware da máquina e grava em inventario-completo.local.json.

.DESCRIPTION
    Gera o dump BRUTO, incluindo endereço MAC e números de série. Por isso o arquivo de
    saída está no .gitignore e nunca deve ser versionado. Os dados publicados no site
    (src/data/hardware.ts) são a versão sanitizada deste dump.

    Rode antes de decidir um upgrade, para comparar com o estado registrado no site.

    Nota: todas as coleções são montadas dentro de @(...). Sem isso, uma coleção de um
    único elemento (uma GPU, uma placa de rede) vira objeto em vez de array no
    ConvertTo-Json, e quem lê o JSON quebra ao indexar [0].

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts\coletar-inventario.ps1
#>

$ErrorActionPreference = 'Stop'

$destino = Join-Path (Split-Path $PSScriptRoot -Parent) 'inventario-completo.local.json'

function Get-TextoEdid([array]$bytes) {
    if (-not $bytes) { return $null }
    ($bytes | Where-Object { $_ -gt 0 } | ForEach-Object { [char]$_ }) -join ''
}

Write-Host 'Coletando CPU, placa-mae e BIOS...' -ForegroundColor Cyan
$cs   = Get-CimInstance Win32_ComputerSystem
$os   = Get-CimInstance Win32_OperatingSystem
$bb   = Get-CimInstance Win32_BaseBoard
$bios = Get-CimInstance Win32_BIOS
$reg  = Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion'
$cpu  = Get-CimInstance Win32_Processor | Select-Object -First 1

Write-Host 'Coletando memoria...' -ForegroundColor Cyan
$memoria = @(Get-CimInstance Win32_PhysicalMemory | ForEach-Object {
    [pscustomobject]@{
        banco           = $_.BankLabel
        slot            = $_.DeviceLocator
        capacidadeGB    = [math]::Round($_.Capacity / 1GB, 2)
        clockNominalMHz = $_.Speed
        clockAtualMHz   = $_.ConfiguredClockSpeed
        voltagemMV      = $_.ConfiguredVoltage
        partNumber      = $_.PartNumber.Trim()
        numeroSerie     = $_.SerialNumber   # sensivel: nao publicar
    }
})

Write-Host 'Coletando discos...' -ForegroundColor Cyan
$fisicos = @{}
try {
    Get-PhysicalDisk | ForEach-Object { $fisicos[$_.FriendlyName] = $_ }
} catch {
    Write-Warning 'Get-PhysicalDisk indisponivel; tipo SSD/HDD ficara nulo.'
}

$discos = @(Get-CimInstance Win32_DiskDrive | ForEach-Object {
    $pd = $fisicos[$_.Model]
    [pscustomobject]@{
        modelo      = $_.Model
        tamanhoGB   = [math]::Round($_.Size / 1GB, 2)
        tipo        = if ($pd) { $pd.MediaType } else { $null }
        barramento  = if ($pd) { $pd.BusType } else { $_.InterfaceType }
        saude       = if ($pd) { $pd.HealthStatus } else { $null }
        particoes   = $_.Partitions
        numeroSerie = $_.SerialNumber   # sensivel: nao publicar
    }
})

$volumes = @(Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3' | ForEach-Object {
    [pscustomobject]@{
        letra      = $_.DeviceID
        rotulo     = $_.VolumeName
        totalGB    = [math]::Round($_.Size / 1GB, 2)
        livreGB    = [math]::Round($_.FreeSpace / 1GB, 2)
        livrePct   = [math]::Round(($_.FreeSpace / $_.Size) * 100, 1)
        sistemaArq = $_.FileSystem
    }
})

Write-Host 'Coletando GPU...' -ForegroundColor Cyan
$gpus = @(Get-CimInstance Win32_VideoController | ForEach-Object {
    # Guardado numa variavel porque dentro do Where-Object o $_ ja e o PnpDevice,
    # nao mais o controlador de video deste laco.
    $nomeGpu = $_.Name
    $hwid = $null
    try {
        $hwid = (Get-PnpDevice -Class Display |
                 Where-Object { $_.FriendlyName -eq $nomeGpu } |
                 Select-Object -First 1 |
                 Get-PnpDeviceProperty -KeyName 'DEVPKEY_Device_HardwareIds').Data |
                 Select-Object -First 1
    } catch { }

    [pscustomobject]@{
        nome          = $nomeGpu
        driver        = $_.DriverVersion
        dataDriver    = $_.DriverDate
        resolucao     = "$($_.CurrentHorizontalResolution)x$($_.CurrentVerticalResolution)"
        atualizacaoHz = $_.CurrentRefreshRate
        hardwareId    = $hwid   # o campo SUBSYS revela o fabricante real da placa
    }
})

# nvidia-smi entrega o que o WMI nao sabe: VRAM acima de 4 GB, VBIOS e largura do link PCIe.
$nvidia = $null
if (Get-Command nvidia-smi -ErrorAction SilentlyContinue) {
    $campos = '--query-gpu=name,memory.total,driver_version,vbios_version,pcie.link.width.current,power.limit'
    $linha = (& nvidia-smi $campos --format=csv,noheader) -split ',\s*'
    if ($linha.Count -ge 6) {
        $nvidia = [pscustomobject]@{
            nome           = $linha[0]
            vramTotal      = $linha[1]
            driver         = $linha[2]
            vbios          = $linha[3]
            larguraPcie    = $linha[4]
            limitePotencia = $linha[5]
        }
    }
}

Write-Host 'Coletando monitores e rede...' -ForegroundColor Cyan
$monitores = @()
try {
    $ids    = @(Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorID)
    $params = @(Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorBasicDisplayParams)
    for ($i = 0; $i -lt $ids.Count; $i++) {
        $h = $params[$i].MaxHorizontalImageSize
        $v = $params[$i].MaxVerticalImageSize
        $monitores += [pscustomobject]@{
            nome         = Get-TextoEdid $ids[$i].UserFriendlyName
            codigoModelo = Get-TextoEdid $ids[$i].ProductCodeID
            fabricante   = Get-TextoEdid $ids[$i].ManufacturerName
            ano          = $ids[$i].YearOfManufacture
            semana       = $ids[$i].WeekOfManufacture
            larguraCm    = $h
            alturaCm     = $v
            polegadas    = [math]::Round([math]::Sqrt(($h * $h) + ($v * $v)) / 2.54, 1)
            numeroSerie  = Get-TextoEdid $ids[$i].SerialNumberID   # sensivel: nao publicar
        }
    }
} catch {
    Write-Warning 'Dados de monitor indisponiveis.'
}

$rede = @(Get-CimInstance Win32_NetworkAdapter -Filter 'PhysicalAdapter=True' | ForEach-Object {
    [pscustomobject]@{
        nome           = $_.Name
        velocidadeMbps = if ($_.Speed) { [math]::Round($_.Speed / 1MB, 0) } else { $null }
        status         = $_.NetConnectionStatus
        mac            = $_.MACAddress   # sensivel: nao publicar
    }
})

$inventario = [ordered]@{
    coletadoEm = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
    aviso      = 'Contem MAC e numeros de serie. NAO versionar: ver .gitignore.'
    sistema    = [ordered]@{
        so          = $os.Caption
        versao      = $reg.DisplayVersion
        build       = "$($reg.CurrentBuild).$($reg.UBR)"
        arquitetura = $os.OSArchitecture
        instaladoEm = $os.InstallDate
        ultimoBoot  = $os.LastBootUpTime
    }
    placaMae = [ordered]@{
        fabricante = $bb.Manufacturer
        modelo     = $bb.Product
        bios       = "$($bios.Manufacturer) $($bios.SMBIOSBIOSVersion)"
        biosData   = $bios.ReleaseDate
    }
    processador = [ordered]@{
        nome             = $cpu.Name.Trim()
        socket           = $cpu.SocketDesignation
        nucleos          = $cpu.NumberOfCores
        threads          = $cpu.NumberOfLogicalProcessors
        clockMHz         = $cpu.CurrentClockSpeed
        clockMaxMHz      = $cpu.MaxClockSpeed
        cacheL2KB        = $cpu.L2CacheSize
        cacheL3KB        = $cpu.L3CacheSize
        virtualizacaoSVM = $cpu.VirtualizationFirmwareEnabled
        slat             = $cpu.SecondLevelAddressTranslationExtensions
    }
    memoria = [ordered]@{
        totalGB     = [math]::Round($cs.TotalPhysicalMemory / 1GB, 2)
        slotsUsados = $memoria.Count
        modulos     = $memoria
    }
    video     = [ordered]@{ adaptadores = $gpus; nvidiaSmi = $nvidia }
    discos    = $discos
    volumes   = $volumes
    monitores = $monitores
    rede      = $rede
}

$inventario | ConvertTo-Json -Depth 6 | Out-File -FilePath $destino -Encoding utf8

Write-Host ''
Write-Host "Inventario gravado em: $destino" -ForegroundColor Green
Write-Host 'Arquivo contem dados sensiveis e esta no .gitignore.' -ForegroundColor Yellow
